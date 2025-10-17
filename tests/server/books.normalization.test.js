import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app, { setDbPool, setRedisClient } from '../../server/src/app.js';
import { invoke } from './helpers/invoke.js';

const baseRedis = {
  get: vi.fn(async () => null),
  set: vi.fn(async () => 'OK'),
  setEx: vi.fn(async () => 'OK'),
  del: vi.fn(async () => 1),
  quit: vi.fn(async () => undefined),
  isOpen: true
};

function createPool(sequenceHandlers) {
  const handlers = Array.isArray(sequenceHandlers) ? [...sequenceHandlers] : [];
  const query = vi.fn(async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    for (const handler of handlers) {
      const match = handler.matcher;
      if (typeof match === 'function' ? match(normalized) : normalized.includes(match)) {
        return handler.handle(normalized, params);
      }
    }
    return { rows: [], rowCount: 0 };
  });

  return { query };
}

beforeEach(() => {
  app.set('trust proxy', false);
  setDbPool(null);
  setRedisClient({ ...baseRedis });
});

afterEach(() => {
  vi.restoreAllMocks();
  setDbPool(null);
  setRedisClient(null);
});

describe('authors normalization', () => {
  it('GET /api/books returns authors as { name } objects', async () => {
    const pool = createPool([
      {
        matcher: 'from books b',
        handle: () => ({
          rows: [
            {
              id: 'book-1',
              title: 'Sample',
              authors: ['Author One', 'Author Two'],
              categories: [],
              price_cents: 0
            }
          ],
          rowCount: 1
        })
      }
    ]);

    setDbPool(pool);
    setRedisClient({ ...baseRedis });

    const response = await invoke(app, { method: 'GET', url: '/api/books' });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.json)).toBe(true);
    expect(response.json[0].authors).toEqual([
      { name: 'Author One' },
      { name: 'Author Two' }
    ]);
  });

  it('POST /api/books accepts array of strings and returns normalized authors', async () => {
    const createdId = 'book-123';
    const insertedAuthors = new Map();

    const pool = createPool([
      {
        matcher: 'insert into books',
        handle: (_, params) => ({
          rows: [
            {
              id: createdId,
              title: params[0],
              description: params[1],
              price_cents: params[2],
              publication_date: params[3],
              is_featured: params[4],
              is_new_release: params[5],
              tags: params[6]
            }
          ],
          rowCount: 1
        })
      },
      {
        matcher: 'select id from authors',
        handle: (_, params) => {
          const existing = insertedAuthors.get(params[0].toLowerCase());
          return {
            rows: existing ? [{ id: existing.id }] : [],
            rowCount: existing ? 1 : 0
          };
        }
      },
      {
        matcher: 'insert into authors',
        handle: (_, params) => {
          const id = `author-${params[0].toLowerCase().replace(/\s+/g, '-')}`;
          insertedAuthors.set(params[0].toLowerCase(), { id, name: params[0] });
          return { rows: [{ id }], rowCount: 1 };
        }
      },
      {
        matcher: 'insert into book_authors',
        handle: () => ({ rows: [], rowCount: 1 })
      },
      {
        matcher: (normalized) =>
          normalized.startsWith('select b.*,') && normalized.includes('where b.id ='),
        handle: () => ({
          rows: [
            {
              id: createdId,
              title: 'New Book',
              authors: Array.from(insertedAuthors.values()).map((entry) => entry.name),
              categories: [],
              price_cents: 0
            }
          ],
          rowCount: 1
        })
      }
    ]);

    setDbPool(pool);
    setRedisClient({ ...baseRedis });

    const response = await invoke(app, {
      method: 'POST',
      url: '/api/books',
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: 'New Book',
        authors: ['Author One', 'Author Two']
      }
    });

    expect(response.status).toBe(201);
    expect(response.json.authors).toEqual([
      { name: 'Author One' },
      { name: 'Author Two' }
    ]);
  });

  it('POST /api/books accepts array of author objects', async () => {
    const createdId = 'book-456';
    const pool = createPool([
      {
        matcher: 'insert into books',
        handle: () => ({
          rows: [
            {
              id: createdId,
              title: 'Another Book'
            }
          ],
          rowCount: 1
        })
      },
      {
        matcher: 'select id from authors',
        handle: () => ({ rows: [], rowCount: 0 })
      },
      {
        matcher: 'insert into authors',
        handle: (_, params) => ({
          rows: [{ id: `author-${params[0].toLowerCase().replace(/\s+/g, '-')}` }],
          rowCount: 1
        })
      },
      {
        matcher: 'insert into book_authors',
        handle: () => ({ rows: [], rowCount: 1 })
      },
      {
        matcher: (normalized) =>
          normalized.startsWith('select b.*,') && normalized.includes('where b.id ='),
        handle: () => ({
          rows: [
            {
              id: createdId,
              title: 'Another Book',
              authors: ['Author Solo'],
              categories: [],
              price_cents: 0
            }
          ],
          rowCount: 1
        })
      }
    ]);

    setDbPool(pool);
    setRedisClient({ ...baseRedis });

    const response = await invoke(app, {
      method: 'POST',
      url: '/api/books',
      headers: { 'Content-Type': 'application/json' },
      body: {
        title: 'Another Book',
        authors: [{ name: 'Author Solo' }]
      }
    });

    expect(response.status).toBe(201);
    expect(response.json.authors).toEqual([{ name: 'Author Solo' }]);
  });
});
