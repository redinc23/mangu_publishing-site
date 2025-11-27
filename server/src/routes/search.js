import express from 'express';
import SearchService from '../services/searchService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Search endpoint with full-text search and faceted filtering
router.get('/search', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        const redisClient = req.app.locals.redis;

        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const searchService = new SearchService(dbPool, redisClient);

        // Parse query parameters
        const searchParams = {
            q: req.query.q,
            categories: req.query.categories ? 
                (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) : [],
            authors: req.query.authors ? 
                (Array.isArray(req.query.authors) ? req.query.authors : [req.query.authors]) : [],
            formats: req.query.formats ? 
                (Array.isArray(req.query.formats) ? req.query.formats : [req.query.formats]) : [],
            languages: req.query.languages ? 
                (Array.isArray(req.query.languages) ? req.query.languages : [req.query.languages]) : [],
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            sortBy: req.query.sortBy || 'relevance',
            sortOrder: req.query.sortOrder || 'desc',
            limit: Math.min(parseInt(req.query.limit) || 20, 100),
            offset: Math.max(parseInt(req.query.offset) || 0, 0)
        };

        // Perform search
        const results = await searchService.fullTextSearch(searchParams);

        // Track search analytics (don't await - fire and forget)
        const userId = req.user?.id || null;
        searchService.trackSearchQuery(searchParams.q, userId, results.total).catch(err => {
            logger.warn('Failed to track search:', err);
        });

        res.json(results);
    } catch (error) {
        logger.error('Search endpoint error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Autocomplete endpoint
router.get('/autocomplete', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        const redisClient = req.app.locals.redis;

        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const searchService = new SearchService(dbPool, redisClient);
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        
        const results = await searchService.autocomplete(q, limit);
        res.json(results);
    } catch (error) {
        logger.error('Autocomplete endpoint error:', error);
        res.status(500).json({
            error: 'Autocomplete failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get search facets (filters available)
router.get('/facets', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        const redisClient = req.app.locals.redis;

        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const searchService = new SearchService(dbPool, redisClient);
        const facets = await searchService.getSearchFacets(req.query.q);

        res.json(facets);
    } catch (error) {
        logger.error('Facets endpoint error:', error);
        res.status(500).json({
            error: 'Failed to get facets',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get popular/trending searches
router.get('/popular', async (req, res) => {
    try {
        const dbPool = req.app.locals.db;
        const redisClient = req.app.locals.redis;

        if (!dbPool) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        const searchService = new SearchService(dbPool, redisClient);
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        
        const searches = await searchService.getPopularSearches(limit);
        res.json({ searches });
    } catch (error) {
        logger.error('Popular searches endpoint error:', error);
        res.status(500).json({
            error: 'Failed to get popular searches',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

export default router;
