/**
 * Blog Comments Controller
 * Handles all blog comment operations
 */

/**
 * Get comments for a blog post
 * GET /api/blog/:postId/comments
 */
export const getComments = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { postId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // First, verify the post exists
    const postCheck = await dbPool.query(
      'SELECT id FROM blog_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Get comments with user details
    const query = `
      SELECT
        c.*,
        u.username,
        u.full_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM blog_comments WHERE parent_comment_id = c.id) as reply_count
      FROM blog_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.is_approved = true
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await dbPool.query(query, [postId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM blog_comments
      WHERE post_id = $1 AND is_approved = true
    `;
    const countResult = await dbPool.query(countQuery, [postId]);

    res.json({
      comments: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('[Blog] Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

/**
 * Add a comment to a blog post
 * POST /api/blog/:postId/comments
 * Requires authentication
 */
export const addComment = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { postId } = req.params;
    const userId = req.auth.userId || req.auth.sub;
    const { content, parentCommentId } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Comment is too long (max 5000 characters)' });
    }

    // Verify the post exists and is published
    const postCheck = await dbPool.query(
      'SELECT id, is_published FROM blog_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (!postCheck.rows[0].is_published) {
      return res.status(400).json({ error: 'Cannot comment on unpublished post' });
    }

    // If parent comment is specified, verify it exists and belongs to same post
    if (parentCommentId) {
      const parentCheck = await dbPool.query(
        'SELECT id, post_id FROM blog_comments WHERE id = $1',
        [parentCommentId]
      );

      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      if (parentCheck.rows[0].post_id !== postId) {
        return res.status(400).json({ error: 'Parent comment belongs to different post' });
      }
    }

    // Create comment
    const insertQuery = `
      INSERT INTO blog_comments (post_id, user_id, parent_comment_id, content, is_approved)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;

    const result = await dbPool.query(insertQuery, [
      postId,
      userId,
      parentCommentId || null,
      content.trim()
    ]);

    // Get comment with user details
    const commentQuery = `
      SELECT
        c.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM blog_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const commentResult = await dbPool.query(commentQuery, [result.rows[0].id]);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: commentResult.rows[0]
    });
  } catch (error) {
    console.error('[Blog] Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

/**
 * Edit own comment
 * PUT /api/blog/comments/:id
 * Requires authentication
 */
export const editComment = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;
    const { content } = req.body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Comment is too long (max 5000 characters)' });
    }

    // Check if comment exists and belongs to user
    const checkQuery = `
      SELECT * FROM blog_comments
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await dbPool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Update comment
    const updateQuery = `
      UPDATE blog_comments
      SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `;

    const result = await dbPool.query(updateQuery, [content.trim(), id, userId]);

    // Get comment with user details
    const commentQuery = `
      SELECT
        c.*,
        u.username,
        u.full_name,
        u.avatar_url
      FROM blog_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const commentResult = await dbPool.query(commentQuery, [id]);

    res.json({
      message: 'Comment updated successfully',
      comment: commentResult.rows[0]
    });
  } catch (error) {
    console.error('[Blog] Error editing comment:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
};

/**
 * Delete own comment
 * DELETE /api/blog/comments/:id
 * Requires authentication
 */
export const deleteComment = async (req, res) => {
  try {
    const dbPool = req.app.locals.db;
    if (!dbPool) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const { id } = req.params;
    const userId = req.auth.userId || req.auth.sub;

    // Check if comment exists and belongs to user
    const checkQuery = `
      SELECT * FROM blog_comments
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await dbPool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    // Check if comment has replies
    const repliesQuery = `
      SELECT COUNT(*) as reply_count
      FROM blog_comments
      WHERE parent_comment_id = $1
    `;
    const repliesResult = await dbPool.query(repliesQuery, [id]);

    if (parseInt(repliesResult.rows[0].reply_count) > 0) {
      // If has replies, just mark as deleted instead of removing
      const updateQuery = `
        UPDATE blog_comments
        SET content = '[deleted]', is_approved = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      await dbPool.query(updateQuery, [id]);

      return res.json({
        message: 'Comment marked as deleted (has replies)',
        deleted: true
      });
    }

    // If no replies, delete completely
    const deleteQuery = `
      DELETE FROM blog_comments
      WHERE id = $1
      RETURNING *
    `;
    await dbPool.query(deleteQuery, [id]);

    res.json({
      message: 'Comment deleted successfully',
      deleted: true
    });
  } catch (error) {
    console.error('[Blog] Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
