import { normalizeAuthors } from '../../utils/normalizeAuthors.js';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const BOOK_WITH_RELATIONS_QUERY = `
    SELECT b.*,
           COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::TEXT[]) AS categories,
           COALESCE(array_agg(DISTINCT a.name) FILTER (WHERE a.id IS NOT NULL), ARRAY[]::TEXT[]) AS authors,
           p.name as publisher_name
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
    LEFT JOIN book_authors ba ON b.id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.id
    LEFT JOIN publishers p ON b.publisher_id = p.id
    WHERE b.id = $1 AND b.is_active = true
    GROUP BY b.id, p.name
`;

export async function fetchBookWithRelations(dbPool, bookId) {
    if (!dbPool) {
        return null;
    }

    const result = await dbPool.query(BOOK_WITH_RELATIONS_QUERY, [bookId]);
    return result.rows[0] || null;
}

export function sanitizeAuthorNames(authorNames) {
    return Array.from(
        new Set(
            (authorNames || [])
                .map((name) => (typeof name === 'string' ? name.trim() : ''))
                .filter(Boolean)
        )
    );
}

export async function attachAuthorsToBook(dbPool, bookId, authorNames) {
    if (!dbPool) {
        return;
    }

    const names = sanitizeAuthorNames(authorNames);

    for (const name of names) {
        const existing = await dbPool.query(
            'SELECT id FROM authors WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [name]
        );

        let authorId;
        if (existing.rows.length > 0) {
            authorId = existing.rows[0].id;
        } else {
            const inserted = await dbPool.query(
                'INSERT INTO authors (name) VALUES ($1) RETURNING id',
                [name]
            );
            authorId = inserted.rows[0].id;
        }

        await dbPool.query(
            `INSERT INTO book_authors (book_id, author_id, role)
             VALUES ($1, $2, 'author')
             ON CONFLICT DO NOTHING`,
            [bookId, authorId]
        );
    }
}

export async function replaceBookAuthors(dbPool, bookId, authorNames) {
    if (!dbPool) {
        return;
    }

    await dbPool.query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);
    await attachAuthorsToBook(dbPool, bookId, authorNames);
}

export function parseOptionalBoolean(value) {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) {
            return true;
        }
        if (['false', '0', 'no', 'n'].includes(normalized)) {
            return false;
        }
        return Boolean(normalized);
    }

    return Boolean(value);
}

export function coerceAuthors(input) {
    const normalized = normalizeAuthors(input);
    return normalized.map((author) => author?.name).filter(Boolean);
}

