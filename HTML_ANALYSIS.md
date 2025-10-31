# HTML Files Categorization Analysis

## Summary
Total HTML files: 45

## Categories

### 1. Homepage (1 file)
- `homepage_v1.html` → Replace/update `HomePage.jsx`

### 2. Book Pages (5 files)
- `book_details.html` → Enhance `BookDetailsPage.jsx`
- `allbooks_page.html` → Map to `LibraryPage.jsx` or create new
- `bestsellers_v1.html` → Create `BestsellersPage.jsx` or filter in LibraryPage
- `newrelease.html` → Create `NewReleasesPage.jsx` or filter in LibraryPage
- `comingso_v1.html` → Create `ComingSoonPage.jsx`

### 3. Author Portal (5 files)
- `authorportal_DASHboard.html` → `pages/author/AuthorDashboardPage.jsx`
- `authorprof1.html` → `pages/author/AuthorProfilePage.jsx`
- `authormyprojects2.html` → `pages/author/AuthorProjectsPage.jsx`
- `authormanusubmitv1.html` → `pages/author/AuthorSubmitPage.jsx`
- `authordbv2.html` → `pages/author/AuthorDatabasePage.jsx` (possibly)

### 4. Blog System (6 files)
- `bloghub_v1.html` → `pages/BlogHubPage.jsx` (main blog listing)
- `bloghug_v2.html` → Alternative version of blog hub
- `blogartsv1.html` → `pages/BlogArticlePage.jsx` (article detail)
- `blogarts2.html` → Alternative article layout
- `blogcat_v1.html` → `pages/BlogCategoryPage.jsx` (category listing)
- `blogcats_v2.html` → Alternative category layout

### 5. Events (4 files)
- `events_page.html` → `pages/EventsPage.jsx` (events listing)
- `eventshub_1.html` → Alternative events hub
- `events2hub.html` → Another events hub variant
- `events2page.html` → Event detail page → `pages/EventDetailPage.jsx`

### 6. Authors (4 files)
- `authorspage_v1.html` → `pages/AuthorsPage.jsx` (authors listing)
- `authorspage_v2.html` → Alternative authors listing
- `authors_detail_v1.html` → `pages/AuthorDetailPage.jsx` (author detail)
- `authors_detail_v2.html` → Alternative author detail layout

### 7. Series (4 files)
- `seriespg_v1.html` → `pages/SeriesPage.jsx` (series listing)
- `seriesdetails_v1.html` → `pages/SeriesDetailsPage.jsx` (series detail)
- `series_deets2.html` → Alternative series detail
- `series_dv1.html` → Another series detail variant

### 8. Genres (2 files)
- `allGenre_pg1.html` → `pages/GenresPage.jsx` (all genres listing)
- `genredetails.html` → `pages/GenreDetailsPage.jsx` (genre detail)

### 9. Store (3 files)
- `bkstore_v1.html` → `pages/BookStorePage.jsx` (store listing)
- `bkstore_v2.html` → Alternative store layout
- `bkstore_v3.html` → Another store variant

### 10. Info Pages (1 file)
- `about_us1.html` → `pages/AboutPage.jsx` (replace NotFoundPage for /about)

### 11. Newsletter (5 files)
- `newsletter_v1.html` → `pages/NewsletterPage.jsx` (primary)
- `newsletter_v2.html` → Alternative newsletter layout
- `newsletter_v3.html` → Another newsletter variant
- `newsletter4.html` → Newsletter variant
- `newslets66.html` → Newsletter variant

### 12. Other Pages (5 files)
- `readers_hubv1.html` → `pages/ReadersHubPage.jsx` (readers community)
- `library_books.html` → Enhance `LibraryPage.jsx` or create variant
- `academia_feats.html` → `pages/AcademiaFeaturesPage.jsx` (academic features)
- `extras.html` → `pages/ExtrasPage.jsx` (additional content)

## Route Mapping Strategy

### Priority 1 - Core Pages
- `/` → HomePage (update from homepage_v1.html)
- `/about` → AboutPage (from about_us1.html)
- `/book/:id` → BookDetailsPage (enhance from book_details.html)

### Priority 2 - Content Pages
- `/blog` → BlogHubPage
- `/blog/:category` → BlogCategoryPage
- `/blog/article/:id` → BlogArticlePage
- `/events` → EventsPage
- `/events/:id` → EventDetailPage
- `/authors` → AuthorsPage
- `/authors/:id` → AuthorDetailPage

### Priority 3 - Author Portal (Protected)
- `/author-portal` → AuthorDashboardPage
- `/author-portal/profile` → AuthorProfilePage
- `/author-portal/projects` → AuthorProjectsPage
- `/author-portal/submit` → AuthorSubmitPage

### Priority 4 - Additional Features
- `/series` → SeriesPage
- `/series/:id` → SeriesDetailsPage
- `/genres` → GenresPage
- `/genres/:id` → GenreDetailsPage
- `/store` → BookStorePage
- `/bestsellers` → BestsellersPage (or filter)
- `/new-releases` → NewReleasesPage (or filter)
- `/coming-soon` → ComingSoonPage
- `/newsletter` → NewsletterPage
- `/readers-hub` → ReadersHubPage
- `/academia` → AcademiaFeaturesPage

## Design System Patterns Identified

### Common CSS Variables Found:
- Netflix-inspired dark theme (--netflix-black, --netflix-dark, --netflix-red)
- Color accents (--accent-blue, --accent-purple, --accent-gold, etc.)
- Transition variables (--transition-base, --transition-master)
- Shadow variables (--shadow-sm, --shadow-md, --shadow-lg)
- Border radius variables (--border-radius, --border-radius-lg)

### Common Components to Extract:
- Header/Navigation (appears in multiple files)
- Footer (appears in multiple files)
- Card components (book cards, author cards, event cards)
- Modal components
- Button components
- Search bar components
- Filter/Sort components

## Next Steps
1. Extract all CSS variables into unified design system
2. Create shared component library
3. Convert files in priority order
4. Integrate with existing React app structure


