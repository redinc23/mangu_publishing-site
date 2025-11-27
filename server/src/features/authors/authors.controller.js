export async function getFeaturedAuthors(req, res) {
  const db = req.app.locals.db;
  
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  try {
    const result = await db.query(
      `SELECT id, name, bio, photo_url, website_url, is_verified
       FROM authors
       WHERE is_verified = true
       ORDER BY created_at DESC
       LIMIT 10`
    );
    res.json({ authors: result.rows });
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
}
