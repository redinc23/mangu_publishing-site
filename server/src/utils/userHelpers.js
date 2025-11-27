/**
 * Helper functions for user operations
 */

/**
 * Get or create user_id from cognito_sub
 * Returns the user's UUID from the users table, creating the user if needed
 * @param {Pool} pool - Database pool
 * @param {string} cognitoSub - Cognito sub (user identifier)
 * @param {string} email - User email (optional, for creating new users)
 * @param {string} username - Username (optional, for creating new users)
 * @returns {Promise<string>} - User UUID
 */
export async function getOrCreateUserId(pool, cognitoSub, email = null, username = null) {
  if (!pool) {
    throw new Error('Database pool not available');
  }

  // First, try to get existing user
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE cognito_sub = $1',
    [cognitoSub]
  );

  if (existingUser.rows.length > 0) {
    return existingUser.rows[0].id;
  }

  // User doesn't exist, create one
  // Generate a default username if not provided (use more of cognito_sub to ensure uniqueness)
  const baseUsername = username || `user_${cognitoSub.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)}`;
  let finalUsername = baseUsername;
  let attempt = 0;
  const maxAttempts = 10;

  // Try to find a unique username
  while (attempt < maxAttempts) {
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [finalUsername]
    );

    if (usernameCheck.rows.length === 0) {
      break; // Username is available
    }

    // Username exists, try with a suffix
    attempt++;
    finalUsername = `${baseUsername}_${attempt}`;
  }

  // Generate email if not provided
  const finalEmail = email || `${finalUsername}@example.com`;

  // Insert user, handling conflicts gracefully
  const newUser = await pool.query(
    `INSERT INTO users (cognito_sub, email, username)
     VALUES ($1, $2, $3)
     ON CONFLICT (cognito_sub) DO UPDATE SET cognito_sub = EXCLUDED.cognito_sub
     RETURNING id`,
    [cognitoSub, finalEmail, finalUsername]
  );

  // If insert failed due to conflict, fetch the existing user
  if (newUser.rows.length === 0) {
    const retryUser = await pool.query(
      'SELECT id FROM users WHERE cognito_sub = $1',
      [cognitoSub]
    );
    if (retryUser.rows.length > 0) {
      return retryUser.rows[0].id;
    }
    throw new Error('Failed to create or retrieve user');
  }

  return newUser.rows[0].id;
}

