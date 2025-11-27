import logger from '../utils/logger.js';

export class SearchService {
    constructor(dbPool, redisClient) {
        this.db = dbPool;
        this.redis = redisClient;
        this.CACHE_TTL = 300; // 5 minutes
    }

    async fullTextSearch(searchParams) {
        const {
            q,
            categories = [],
            authors = [],
            formats = [],
            minPrice,
            maxPrice,
            minRating,
            languages = [],
            sortBy = 'relevance',
            sortOrder = 'desc',
            limit = 20,
            offset = 0
        } = searchParams;

        // Check cache first
        const cacheKey = this._generateCacheKey('search', searchParams);
        const cached = await this._getCache(cacheKey);
        if (cached) return cached;

        const params = [];
        let paramCount = 0;

        // Base query with full-text search and relevance scoring
        let query = `
            WITH search_results AS (
                SELECT 
                    b.*,
                    array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories,
                    array_agg(DISTINCT c.slug) FILTER (WHERE c.slug IS NOT NULL) as category_slugs,
                    array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as authors,
                    array_agg(DISTINCT a.id) FILTER (WHERE a.id IS NOT NULL) as author_ids,
                    p.name as publisher_name,
                    COUNT(DISTINCT r.id) as review_count,
                    AVG(r.rating) as avg_rating,
                    ${this._buildRelevanceScore(q, ++paramCount)}
                FROM books b
                LEFT JOIN book_categories bc ON b.id = bc.book_id
                LEFT JOIN categories c ON bc.category_id = c.id
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                LEFT JOIN publishers p ON b.publisher_id = p.id
                LEFT JOIN reviews r ON b.id = r.book_id AND r.is_approved = true
                WHERE b.is_active = true
        `;

        if (q) {
            params.push(q);
        }

        // Add filters
        if (categories.length > 0) {
            query += ` AND c.slug = ANY($${++paramCount})`;
            params.push(categories);
        }

        if (authors.length > 0) {
            query += ` AND a.id = ANY($${++paramCount})`;
            params.push(authors);
        }

        if (formats.length > 0) {
            query += ` AND b.format = ANY($${++paramCount})`;
            params.push(formats);
        }

        if (minPrice !== undefined) {
            query += ` AND b.price >= $${++paramCount}`;
            params.push(minPrice);
        }

        if (maxPrice !== undefined) {
            query += ` AND b.price <= $${++paramCount}`;
            params.push(maxPrice);
        }

        if (minRating !== undefined) {
            query += ` AND b.rating >= $${++paramCount}`;
            params.push(minRating);
        }

        if (languages.length > 0) {
            query += ` AND b.language = ANY($${++paramCount})`;
            params.push(languages);
        }

        query += `
                GROUP BY b.id, p.name
            )
            SELECT * FROM search_results
        `;

        // Add sorting
        query += this._buildSortClause(sortBy, sortOrder);

        // Add pagination
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(limit, offset);

        try {
            const result = await this.db.query(query, params);
            
            // Get total count
            const countQuery = this._buildCountQuery(searchParams);
            const countResult = await this.db.query(countQuery.query, countQuery.params);
            const total = parseInt(countResult.rows[0]?.count || 0);

            const response = {
                results: result.rows,
                total,
                limit,
                offset,
                hasMore: offset + result.rows.length < total
            };

            // Cache the results
            await this._setCache(cacheKey, response, this.CACHE_TTL);

            return response;
        } catch (error) {
            logger.error('Search query error:', error);
            throw error;
        }
    }

    async autocomplete(query, limit = 10) {
        if (!query || query.length < 2) {
            return { suggestions: [] };
        }

        const cacheKey = `search:autocomplete:${query}:${limit}`;
        const cached = await this._getCache(cacheKey);
        if (cached) return cached;

        const searchQuery = `
            SELECT 
                title,
                'book' as type,
                id,
                cover_url,
                rating,
                (
                    similarity(title, $1) * 2 +
                    similarity(COALESCE(subtitle, ''), $1)
                ) as relevance
            FROM books
            WHERE 
                is_active = true AND
                (title ILIKE $2 OR subtitle ILIKE $2)
            
            UNION ALL
            
            SELECT 
                name as title,
                'author' as type,
                id,
                photo_url as cover_url,
                NULL as rating,
                similarity(name, $1) as relevance
            FROM authors
            WHERE name ILIKE $2
            
            UNION ALL
            
            SELECT 
                name as title,
                'category' as type,
                id,
                NULL as cover_url,
                NULL as rating,
                similarity(name, $1) as relevance
            FROM categories
            WHERE is_active = true AND name ILIKE $2
            
            ORDER BY relevance DESC, rating DESC NULLS LAST
            LIMIT $3
        `;

        try {
            const result = await this.db.query(searchQuery, [
                query,
                `%${query}%`,
                limit
            ]);

            const response = { suggestions: result.rows };
            await this._setCache(cacheKey, response, 60); // Cache for 1 minute

            return response;
        } catch (error) {
            logger.error('Autocomplete query error:', error);
            throw error;
        }
    }

    async getSearchFacets(query) {
        const cacheKey = `search:facets:${query || 'all'}`;
        const cached = await this._getCache(cacheKey);
        if (cached) return cached;

        try {
            const facetsQuery = `
                WITH book_pool AS (
                    SELECT b.id
                    FROM books b
                    WHERE b.is_active = true
                    ${query ? `AND (
                        b.title ILIKE $1 OR 
                        b.description ILIKE $1 OR
                        b.subtitle ILIKE $1
                    )` : ''}
                )
                SELECT 
                    json_build_object(
                        'categories', (
                            SELECT json_agg(json_build_object(
                                'id', c.id,
                                'name', c.name,
                                'slug', c.slug,
                                'count', COUNT(DISTINCT bc.book_id)
                            ))
                            FROM categories c
                            LEFT JOIN book_categories bc ON c.id = bc.category_id
                            INNER JOIN book_pool bp ON bc.book_id = bp.id
                            WHERE c.is_active = true
                            GROUP BY c.id, c.name, c.slug
                            HAVING COUNT(DISTINCT bc.book_id) > 0
                            ORDER BY COUNT(DISTINCT bc.book_id) DESC
                        ),
                        'authors', (
                            SELECT json_agg(json_build_object(
                                'id', a.id,
                                'name', a.name,
                                'count', COUNT(DISTINCT ba.book_id)
                            ))
                            FROM authors a
                            LEFT JOIN book_authors ba ON a.id = ba.author_id
                            INNER JOIN book_pool bp ON ba.book_id = bp.id
                            GROUP BY a.id, a.name
                            HAVING COUNT(DISTINCT ba.book_id) > 0
                            ORDER BY COUNT(DISTINCT ba.book_id) DESC
                            LIMIT 20
                        ),
                        'formats', (
                            SELECT json_agg(json_build_object(
                                'format', b.format,
                                'count', COUNT(*)
                            ))
                            FROM books b
                            INNER JOIN book_pool bp ON b.id = bp.id
                            WHERE b.format IS NOT NULL
                            GROUP BY b.format
                        ),
                        'languages', (
                            SELECT json_agg(json_build_object(
                                'language', b.language,
                                'count', COUNT(*)
                            ))
                            FROM books b
                            INNER JOIN book_pool bp ON b.id = bp.id
                            WHERE b.language IS NOT NULL
                            GROUP BY b.language
                        ),
                        'priceRanges', (
                            SELECT json_build_object(
                                'min', MIN(b.price),
                                'max', MAX(b.price),
                                'avg', AVG(b.price),
                                'ranges', json_agg(range_data)
                            )
                            FROM (
                                SELECT 
                                    CASE 
                                        WHEN b.price < 10 THEN '0-10'
                                        WHEN b.price < 20 THEN '10-20'
                                        WHEN b.price < 50 THEN '20-50'
                                        ELSE '50+'
                                    END as range,
                                    COUNT(*) as count
                                FROM books b
                                INNER JOIN book_pool bp ON b.id = bp.id
                                WHERE b.price IS NOT NULL
                                GROUP BY range
                            ) range_data
                        )
                    ) as facets
            `;

            const params = query ? [`%${query}%`] : [];
            const result = await this.db.query(facetsQuery, params);
            const facets = result.rows[0]?.facets || {};

            await this._setCache(cacheKey, facets, this.CACHE_TTL);
            return facets;
        } catch (error) {
            logger.error('Get facets error:', error);
            throw error;
        }
    }

    async trackSearchQuery(query, userId = null, resultCount = 0) {
        try {
            const insertQuery = `
                INSERT INTO search_analytics (
                    query, user_id, result_count, created_at
                )
                VALUES ($1, $2, $3, NOW())
            `;
            await this.db.query(insertQuery, [query, userId, resultCount]);
        } catch (error) {
            logger.warn('Failed to track search query:', error);
        }
    }

    async getPopularSearches(limit = 10) {
        const cacheKey = `search:popular:${limit}`;
        const cached = await this._getCache(cacheKey);
        if (cached) return cached;

        try {
            const query = `
                SELECT 
                    query,
                    COUNT(*) as search_count,
                    AVG(result_count) as avg_results
                FROM search_analytics
                WHERE created_at >= NOW() - INTERVAL '7 days'
                GROUP BY query
                HAVING COUNT(*) > 1
                ORDER BY search_count DESC
                LIMIT $1
            `;

            const result = await this.db.query(query, [limit]);
            const searches = result.rows;

            await this._setCache(cacheKey, searches, 3600); // Cache for 1 hour
            return searches;
        } catch (error) {
            logger.warn('Get popular searches error:', error);
            return [];
        }
    }

    _buildRelevanceScore(query, paramIndex) {
        if (!query) {
            return '0 as relevance_score';
        }

        return `(
            CASE 
                WHEN b.title ILIKE '%' || $${paramIndex} || '%' THEN 100
                ELSE 0
            END +
            CASE 
                WHEN b.subtitle ILIKE '%' || $${paramIndex} || '%' THEN 50
                ELSE 0
            END +
            CASE 
                WHEN b.description ILIKE '%' || $${paramIndex} || '%' THEN 25
                ELSE 0
            END +
            (similarity(b.title, $${paramIndex}) * 200) +
            (similarity(COALESCE(b.description, ''), $${paramIndex}) * 50)
        ) as relevance_score`;
    }

    _buildSortClause(sortBy, sortOrder = 'desc') {
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        const sortMappings = {
            relevance: `relevance_score ${order}, avg_rating DESC NULLS LAST`,
            rating: `avg_rating ${order} NULLS LAST, review_count DESC`,
            price: `price ${order} NULLS LAST`,
            newest: `publication_date DESC NULLS LAST, created_at DESC`,
            title: `title ${order}`,
            popularity: `review_count ${order}, avg_rating DESC NULLS LAST`
        };

        return ` ORDER BY ${sortMappings[sortBy] || sortMappings.relevance}`;
    }

    _buildCountQuery(searchParams) {
        const { q, categories, authors, formats, minPrice, maxPrice, minRating, languages } = searchParams;
        const params = [];
        let paramCount = 0;

        let query = `
            SELECT COUNT(DISTINCT b.id) as count
            FROM books b
            LEFT JOIN book_categories bc ON b.id = bc.book_id
            LEFT JOIN categories c ON bc.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.is_active = true
        `;

        if (q) {
            query += ` AND (b.title ILIKE $${++paramCount} OR b.description ILIKE $${paramCount} OR b.subtitle ILIKE $${paramCount})`;
            params.push(`%${q}%`);
        }

        if (categories?.length > 0) {
            query += ` AND c.slug = ANY($${++paramCount})`;
            params.push(categories);
        }

        if (authors?.length > 0) {
            query += ` AND a.id = ANY($${++paramCount})`;
            params.push(authors);
        }

        if (formats?.length > 0) {
            query += ` AND b.format = ANY($${++paramCount})`;
            params.push(formats);
        }

        if (minPrice !== undefined) {
            query += ` AND b.price >= $${++paramCount}`;
            params.push(minPrice);
        }

        if (maxPrice !== undefined) {
            query += ` AND b.price <= $${++paramCount}`;
            params.push(maxPrice);
        }

        if (minRating !== undefined) {
            query += ` AND b.rating >= $${++paramCount}`;
            params.push(minRating);
        }

        if (languages?.length > 0) {
            query += ` AND b.language = ANY($${++paramCount})`;
            params.push(languages);
        }

        return { query, params };
    }

    _generateCacheKey(prefix, params) {
        const sortedParams = JSON.stringify(params, Object.keys(params).sort());
        return `${prefix}:${Buffer.from(sortedParams).toString('base64').substring(0, 50)}`;
    }

    async _getCache(key) {
        if (!this.redis || typeof this.redis.get !== 'function') {
            return null;
        }

        try {
            const cached = await this.redis.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.warn('Cache read error:', error);
            return null;
        }
    }

    async _setCache(key, value, ttl) {
        if (!this.redis || typeof this.redis.setEx !== 'function') {
            return;
        }

        try {
            await this.redis.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            logger.warn('Cache write error:', error);
        }
    }
}

export default SearchService;
