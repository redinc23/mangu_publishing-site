// server/src/features/reading-sessions/reading-sessions.controller.js

/**
 * POST /api/reading-sessions
 * Start a new reading session
 */
export const startReadingSession = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { bookId, progressStart = 0, deviceType, userAgent } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // Check if book exists
    const bookCheck = await dbPool.query(
      'SELECT id FROM books WHERE id = $1',
      [bookId]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await dbPool.query(
      `INSERT INTO reading_sessions
       (user_id, book_id, progress_start, device_type, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, book_id, started_at, progress_start`,
      [userId, bookId, progressStart, deviceType || null, ipAddress, userAgent || req.headers['user-agent']]
    );

    res.status(201).json({
      session: result.rows[0],
      message: 'Reading session started'
    });
  } catch (error) {
    console.error('[Reading Sessions] Error starting session:', error);
    res.status(500).json({ error: 'Failed to start reading session' });
  }
};

/**
 * PUT /api/reading-sessions/:id
 * Update a reading session (progress, end time)
 */
export const updateReadingSession = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { id } = req.params;
    const { progressEnd, pagesRead, endSession = false } = req.body;

    // Check session ownership
    const sessionCheck = await dbPool.query(
      'SELECT id, started_at, book_id FROM reading_sessions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reading session not found' });
    }

    const session = sessionCheck.rows[0];

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (progressEnd !== undefined) {
      updates.push(`progress_end = $${paramCount}`);
      values.push(progressEnd);
      paramCount++;
    }

    if (pagesRead !== undefined) {
      updates.push(`pages_read = $${paramCount}`);
      values.push(pagesRead);
      paramCount++;
    }

    if (endSession) {
      updates.push(`ended_at = CURRENT_TIMESTAMP`);

      // Calculate duration in minutes
      updates.push(`duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) / 60`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    const result = await dbPool.query(
      `UPDATE reading_sessions
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, user_id, book_id, started_at, ended_at, duration_minutes,
                 pages_read, progress_start, progress_end`,
      values
    );

    // If session ended, update user_library progress
    if (endSession && progressEnd !== undefined) {
      await dbPool.query(
        `UPDATE user_library
         SET progress_percent = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND book_id = $3`,
        [progressEnd, userId, session.book_id]
      );
    }

    res.json({
      session: result.rows[0],
      message: endSession ? 'Reading session ended' : 'Reading session updated'
    });
  } catch (error) {
    console.error('[Reading Sessions] Error updating session:', error);
    res.status(500).json({ error: 'Failed to update reading session' });
  }
};

/**
 * GET /api/reading-sessions/stats
 * Get reading statistics for the user
 */
export const getReadingStats = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const userId = req.auth.userId || req.auth.sub;
    const { period = '30' } = req.query; // days

    // Get overall stats
    const overallStats = await dbPool.query(
      `SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COALESCE(SUM(pages_read), 0) as total_pages,
        COUNT(DISTINCT book_id) as books_read_count
       FROM reading_sessions
       WHERE user_id = $1 AND ended_at IS NOT NULL`,
      [userId]
    );

    // Get recent stats (last N days)
    const recentStats = await dbPool.query(
      `SELECT
        COUNT(*) as sessions_count,
        COALESCE(SUM(duration_minutes), 0) as total_minutes,
        COALESCE(SUM(pages_read), 0) as total_pages
       FROM reading_sessions
       WHERE user_id = $1
         AND ended_at IS NOT NULL
         AND started_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'`,
      [userId]
    );

    // Get reading by day (last 7 days)
    const dailyStats = await dbPool.query(
      `SELECT
        DATE(started_at) as date,
        COUNT(*) as sessions,
        COALESCE(SUM(duration_minutes), 0) as minutes
       FROM reading_sessions
       WHERE user_id = $1
         AND ended_at IS NOT NULL
         AND started_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(started_at)
       ORDER BY date DESC`,
      [userId]
    );

    // Get most read books
    const topBooks = await dbPool.query(
      `SELECT
        b.id, b.title, b.cover_url,
        COUNT(rs.id) as session_count,
        COALESCE(SUM(rs.duration_minutes), 0) as total_minutes
       FROM reading_sessions rs
       JOIN books b ON rs.book_id = b.id
       WHERE rs.user_id = $1 AND rs.ended_at IS NOT NULL
       GROUP BY b.id, b.title, b.cover_url
       ORDER BY total_minutes DESC
       LIMIT 5`,
      [userId]
    );

    // Calculate averages
    const avgMinutesPerSession = overallStats.rows[0].total_sessions > 0
      ? Math.round(overallStats.rows[0].total_minutes / overallStats.rows[0].total_sessions)
      : 0;

    res.json({
      stats: {
        overall: {
          ...overallStats.rows[0],
          avg_minutes_per_session: avgMinutesPerSession
        },
        recent: {
          period_days: parseInt(period),
          ...recentStats.rows[0]
        },
        daily: dailyStats.rows,
        top_books: topBooks.rows
      }
    });
  } catch (error) {
    console.error('[Reading Sessions] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch reading stats' });
  }
};
