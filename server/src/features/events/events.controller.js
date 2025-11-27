/**
 * Events Controller
 * Handles all event-related operations including listing, details, and registrations
 */

/**
 * Get list of upcoming events
 * GET /api/events
 */
export const getEvents = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { limit = 20, offset = 0, type, featured } = req.query;

    let query = `
      SELECT
        e.*,
        u.username as host_username,
        u.full_name as host_name,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status = 'confirmed') as registered_count
      FROM events e
      LEFT JOIN users u ON e.host_user_id = u.id
      WHERE e.is_public = true
    `;

    const params = [];
    let paramIndex = 1;

    // Filter by event type
    if (type) {
      query += ` AND e.event_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Filter by featured
    if (featured === 'true') {
      query += ` AND e.is_featured = true`;
    }

    // Only show future events
    query += ` AND e.start_time > CURRENT_TIMESTAMP`;

    // Order by start time
    query += ` ORDER BY e.start_time ASC`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await dbPool.query(query, params);

    res.json({
      events: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('[Events] Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * Get single event details
 * GET /api/events/:id
 */
export const getEventById = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;

    const eventQuery = `
      SELECT
        e.*,
        u.username as host_username,
        u.full_name as host_name,
        u.avatar_url as host_avatar,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status = 'confirmed') as registered_count
      FROM events e
      LEFT JOIN users u ON e.host_user_id = u.id
      WHERE e.id = $1
    `;

    const result = await dbPool.query(eventQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = result.rows[0];

    // Check if user is registered (if authenticated)
    if (req.auth && req.auth.userId) {
      const userId = req.auth.userId || req.auth.sub;
      const registrationQuery = `
        SELECT status, registered_at
        FROM event_registrations
        WHERE event_id = $1 AND user_id = $2
      `;
      const regResult = await dbPool.query(registrationQuery, [id, userId]);
      event.user_registration = regResult.rows[0] || null;
    }

    res.json({ event });
  } catch (error) {
    console.error('[Events] Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
};

/**
 * Register for an event
 * POST /api/events/:id/register
 * Requires authentication
 */
export const registerForEvent = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;
    const { notes } = req.body;

    // Check if event exists and is open for registration
    const eventQuery = `
      SELECT
        e.*,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND status = 'confirmed') as registered_count
      FROM events e
      WHERE e.id = $1
    `;
    const eventResult = await dbPool.query(eventQuery, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    // Check if registration deadline has passed
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Check if event has reached max attendees
    if (event.max_attendees && event.registered_count >= event.max_attendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if user is already registered
    const existingQuery = `
      SELECT * FROM event_registrations
      WHERE event_id = $1 AND user_id = $2
    `;
    const existing = await dbPool.query(existingQuery, [id, userId]);

    if (existing.rows.length > 0) {
      const registration = existing.rows[0];
      if (registration.status === 'confirmed') {
        return res.status(400).json({ error: 'Already registered for this event' });
      }
      // If previously cancelled, update status to confirmed
      const updateQuery = `
        UPDATE event_registrations
        SET status = 'confirmed', registered_at = CURRENT_TIMESTAMP, cancelled_at = NULL, notes = $3
        WHERE event_id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await dbPool.query(updateQuery, [id, userId, notes]);
      return res.json({
        message: 'Successfully re-registered for event',
        registration: result.rows[0]
      });
    }

    // Create new registration
    const insertQuery = `
      INSERT INTO event_registrations (event_id, user_id, status, notes)
      VALUES ($1, $2, 'confirmed', $3)
      RETURNING *
    `;
    const result = await dbPool.query(insertQuery, [id, userId, notes]);

    res.status(201).json({
      message: 'Successfully registered for event',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('[Events] Error registering for event:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    res.status(500).json({ error: 'Failed to register for event' });
  }
};

/**
 * Unregister from an event
 * DELETE /api/events/:id/register
 * Requires authentication
 */
export const unregisterFromEvent = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;

    // Check if user is registered
    const checkQuery = `
      SELECT * FROM event_registrations
      WHERE event_id = $1 AND user_id = $2 AND status = 'confirmed'
    `;
    const checkResult = await dbPool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Update registration status to cancelled
    const updateQuery = `
      UPDATE event_registrations
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE event_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await dbPool.query(updateQuery, [id, userId]);

    res.json({
      message: 'Successfully unregistered from event',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('[Events] Error unregistering from event:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
};
