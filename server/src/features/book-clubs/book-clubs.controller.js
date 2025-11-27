/**
 * Book Clubs Controller
 * Handles all book club operations including listing, details, and membership
 */

/**
 * Get list of public book clubs
 * GET /api/book-clubs
 */
export const getBookClubs = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT
        bc.*,
        u.username as creator_username,
        u.full_name as creator_name,
        b.title as current_book_title,
        b.cover_url as current_book_cover,
        (SELECT COUNT(*) FROM book_club_members WHERE book_club_id = bc.id AND is_active = true) as member_count
      FROM book_clubs bc
      LEFT JOIN users u ON bc.creator_user_id = u.id
      LEFT JOIN books b ON bc.current_book_id = b.id
      WHERE bc.is_public = true
      ORDER BY bc.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await dbPool.query(query, [parseInt(limit), parseInt(offset)]);

    res.json({
      bookClubs: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('[BookClubs] Error fetching book clubs:', error);
    res.status(500).json({ error: 'Failed to fetch book clubs' });
  }
};

/**
 * Get single book club details with members
 * GET /api/book-clubs/:id
 */
export const getBookClubById = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;

    // Get club details
    const clubQuery = `
      SELECT
        bc.*,
        u.username as creator_username,
        u.full_name as creator_name,
        u.avatar_url as creator_avatar,
        b.title as current_book_title,
        b.cover_url as current_book_cover,
        b.id as current_book_id,
        (SELECT COUNT(*) FROM book_club_members WHERE book_club_id = bc.id AND is_active = true) as member_count
      FROM book_clubs bc
      LEFT JOIN users u ON bc.creator_user_id = u.id
      LEFT JOIN books b ON bc.current_book_id = b.id
      WHERE bc.id = $1
    `;

    const clubResult = await dbPool.query(clubQuery, [id]);

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book club not found' });
    }

    const club = clubResult.rows[0];

    // Get recent members
    const membersQuery = `
      SELECT
        m.id,
        m.role,
        m.joined_at,
        u.username,
        u.full_name,
        u.avatar_url
      FROM book_club_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.book_club_id = $1 AND m.is_active = true
      ORDER BY m.joined_at DESC
      LIMIT 20
    `;

    const membersResult = await dbPool.query(membersQuery, [id]);
    club.members = membersResult.rows;

    // Check if user is a member (if authenticated)
    if (req.auth && req.auth.userId) {
      const userId = req.auth.userId || req.auth.sub;
      const membershipQuery = `
        SELECT role, joined_at, is_active
        FROM book_club_members
        WHERE book_club_id = $1 AND user_id = $2
      `;
      const membershipResult = await dbPool.query(membershipQuery, [id, userId]);
      club.user_membership = membershipResult.rows[0] || null;
    }

    res.json({ bookClub: club });
  } catch (error) {
    console.error('[BookClubs] Error fetching book club:', error);
    res.status(500).json({ error: 'Failed to fetch book club details' });
  }
};

/**
 * Join a book club
 * POST /api/book-clubs/:id/join
 * Requires authentication
 */
export const joinBookClub = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;

    // Check if club exists and has space
    const clubQuery = `
      SELECT
        bc.*,
        (SELECT COUNT(*) FROM book_club_members WHERE book_club_id = bc.id AND is_active = true) as member_count
      FROM book_clubs bc
      WHERE bc.id = $1
    `;
    const clubResult = await dbPool.query(clubQuery, [id]);

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book club not found' });
    }

    const club = clubResult.rows[0];

    // Check if club has reached max members
    if (club.max_members && club.member_count >= club.max_members) {
      return res.status(400).json({ error: 'Book club is full' });
    }

    // Check if user is already a member
    const existingQuery = `
      SELECT * FROM book_club_members
      WHERE book_club_id = $1 AND user_id = $2
    `;
    const existing = await dbPool.query(existingQuery, [id, userId]);

    if (existing.rows.length > 0) {
      const membership = existing.rows[0];
      if (membership.is_active) {
        return res.status(400).json({ error: 'Already a member of this book club' });
      }
      // If previously left, reactivate membership
      const updateQuery = `
        UPDATE book_club_members
        SET is_active = true, joined_at = CURRENT_TIMESTAMP
        WHERE book_club_id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await dbPool.query(updateQuery, [id, userId]);
      return res.json({
        message: 'Successfully rejoined book club',
        membership: result.rows[0]
      });
    }

    // Create new membership
    const insertQuery = `
      INSERT INTO book_club_members (book_club_id, user_id, role, is_active)
      VALUES ($1, $2, 'member', true)
      RETURNING *
    `;
    const result = await dbPool.query(insertQuery, [id, userId]);

    res.status(201).json({
      message: 'Successfully joined book club',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('[BookClubs] Error joining book club:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Already a member of this book club' });
    }
    res.status(500).json({ error: 'Failed to join book club' });
  }
};

/**
 * Leave a book club
 * DELETE /api/book-clubs/:id/leave
 * Requires authentication
 */
export const leaveBookClub = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;

    // Check if user is a member
    const checkQuery = `
      SELECT * FROM book_club_members
      WHERE book_club_id = $1 AND user_id = $2 AND is_active = true
    `;
    const checkResult = await dbPool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    const membership = checkResult.rows[0];

    // Prevent creator from leaving if they're the only admin
    if (membership.role === 'admin') {
      const adminCountQuery = `
        SELECT COUNT(*) as admin_count
        FROM book_club_members
        WHERE book_club_id = $1 AND role = 'admin' AND is_active = true
      `;
      const adminCount = await dbPool.query(adminCountQuery, [id]);
      if (parseInt(adminCount.rows[0].admin_count) === 1) {
        return res.status(400).json({
          error: 'Cannot leave: you are the only admin. Please assign another admin first.'
        });
      }
    }

    // Deactivate membership
    const updateQuery = `
      UPDATE book_club_members
      SET is_active = false
      WHERE book_club_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await dbPool.query(updateQuery, [id, userId]);

    res.json({
      message: 'Successfully left book club',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('[BookClubs] Error leaving book club:', error);
    res.status(500).json({ error: 'Failed to leave book club' });
  }
};
