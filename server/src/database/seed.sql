-- ===================================================================
-- MANGU Publishing Additional Seed Data
-- Description: Additional sample data for development and testing
-- ===================================================================

-- Link books to categories
INSERT INTO book_categories (book_id, category_id, is_primary)
SELECT b.id, c.id, true
FROM books b, categories c
WHERE (b.title = 'The Quantum Garden' AND c.slug = 'science-fiction')
   OR (b.title = 'Digital Shadows' AND c.slug = 'thriller')
   OR (b.title = 'The Last Observatory' AND c.slug = 'fantasy')
   OR (b.title = 'Hearts in Silicon Valley' AND c.slug = 'romance')
   OR (b.title = 'The Algorithm Murder' AND c.slug = 'mystery')
ON CONFLICT DO NOTHING;

-- Link books to authors
INSERT INTO book_authors (book_id, author_id, role)
SELECT b.id, a.id, 'author'
FROM books b, authors a
WHERE (b.title = 'The Quantum Garden' AND a.name = 'Elena Vasquez')
   OR (b.title = 'Digital Shadows' AND a.name = 'Marcus Chen')
   OR (b.title = 'The Last Observatory' AND a.name = 'Sarah Kim')
   OR (b.title = 'Hearts in Silicon Valley' AND a.name = 'James Rodriguez')
   OR (b.title = 'The Algorithm Murder' AND a.name = 'Lisa Wang')
ON CONFLICT DO NOTHING;

-- Insert sample reviews
INSERT INTO reviews (user_id, book_id, rating, title, content, is_verified_purchase, helpful_votes)
SELECT 
    gen_random_uuid(),
    b.id,
    (RANDOM() * 5)::INTEGER + 1,
    'Great read!',
    'This book exceeded my expectations. Highly recommended!',
    true,
    (RANDOM() * 50)::INTEGER
FROM books b
WHERE b.title IN ('The Quantum Garden', 'Digital Shadows', 'The Last Observatory')
LIMIT 10;

-- Update book ratings based on reviews
UPDATE books 
SET 
    rating = COALESCE((
        SELECT ROUND(AVG(rating)::NUMERIC, 2)
        FROM reviews 
        WHERE reviews.book_id = books.id 
        AND reviews.is_approved = true
    ), 0),
    rating_count = (
        SELECT COUNT(*)
        FROM reviews 
        WHERE reviews.book_id = books.id 
        AND reviews.is_approved = true
    );
