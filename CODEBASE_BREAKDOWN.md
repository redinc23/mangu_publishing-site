# MANGU2 Publishing Platform - Codebase Breakdown

## 1. Server Routes

### Health & Monitoring Routes
- `GET /api/health` - Comprehensive health check (database, Redis, memory, disk)
- `GET /api/health/ready` - Readiness probe for Kubernetes/ECS
- `GET /api/health/live` - Liveness probe
- `GET /api/health/metrics` - Prometheus/CloudWatch metrics
- `GET /ping` - Simple health check
- `GET /health` - Alias for `/api/health`

### Books Routes
- `GET /api/books` - List all books (paginated, with filters)
- `GET /api/books/:id` - Get book details by ID
- `GET /api/books/featured` - Get featured book (cached)
- `GET /api/books/trending` - Get trending books (cached)
- `GET /api/books/search` - Search books (query, category, author, price filters)
- `GET /api/books/:id/reviews` - Get reviews for a book
- `POST /api/books` - Create a new book (no auth required - **GAP**)
- `PUT /api/books/:id` - Update a book (no auth required - **GAP**)

### Books Feature Router (`/api/books/*`)
- `GET /api/books/featured` - Featured book (via controller)
- `GET /api/books/trending` - Trending books (via controller)
- `GET /api/books/new-releases` - New releases (via controller)
- `GET /api/books/top-rated` - Top rated books (via controller)
- `GET /api/books/all/genres` - All unique genres (via controller)
- `GET /api/books/:id` - Book by ID (via controller)

**Note**: These controller-based routes use DynamoDB, while the main app.js routes use PostgreSQL. This is a **duplication/inconsistency**.

### Categories Routes
- `GET /api/categories` - List all categories with book counts

### Authors Routes (`/api/authors/*`)
- `GET /api/authors/featured` - Get featured authors

**Note**: Uses in-memory data from `data/authors.js`, not database.

### Cart Routes (`/api/cart/*`)
- `GET /api/cart` - Get current cart items
- `POST /api/cart/add` - Add book to cart
- `POST /api/cart/remove` - Remove book from cart
- `POST /api/cart/clear` - Clear entire cart

**Note**: Uses in-memory storage (`cartItems` array), not database. **No authentication required - GAP**.

### Library Routes (`/api/library/*`)
- `GET /api/library` - Get user's library
- `POST /api/library/add` - Add book to library

**Note**: Uses in-memory storage (`libraryItems` array), not database. **No authentication required - GAP**.

### Admin Routes (`/api/admin/*`) - **Protected with adminAuthMiddleware**
- `GET /api/admin/books` - List all books for admin (paginated)
- `GET /api/admin/books/:id` - Get book details for admin
- `POST /api/admin/books` - Create new book
- `PUT /api/admin/books/:id` - Update book
- `DELETE /api/admin/books/:id` - Delete book

### Search Routes (`/api/search/*`)
- `GET /api/search` - Full-text search with faceted filtering
- `GET /api/search/autocomplete` - Autocomplete suggestions
- `GET /api/search/facets` - Get available search facets
- `GET /api/search/popular` - Get popular/trending searches

### Payments Routes (`/api/payments/*`)
- `POST /api/payments/create-checkout-session` - Create Stripe checkout session

**Note**: No webhook handler for Stripe events - **GAP**.

### Notion AI Integration Routes
- `POST /api/notion/generate-description` - Generate book description
- `POST /api/notion/generate-summary` - Generate book summary
- `POST /api/notion/generate-marketing` - Generate marketing copy
- `POST /api/notion/sync-book` - Sync book to Notion
- `GET /api/notion/books` - Get books from Notion
- `GET /api/notion/status` - Check Notion integration status

---

## 2. Client Page Components

### Public Pages (with Layout)
- `/` - `HomePageV2` - Homepage
- `/library` - `LibraryPageV2` - User library
- `/book/:id` - `BookDetailsPageV2` - Book details page
- `/cart` - `CartPageV2` - Shopping cart
- `/profile` - `ProfilePageV2` - User profile
- `/store` - `BookStorePage` - Book store/browse
- `/authors` - `AuthorsPage` - Authors listing
- `/authors/:id` - `AuthorDetailPage` - Author details
- `/genres` - `GenresPage` - Genres listing
- `/genres/:id` - `NotFoundPage` - **GAP: Genre detail page not implemented**
- `/series` - `SeriesPage` - Book series listing
- `/series/:id` - `NotFoundPage` - **GAP: Series detail page not implemented**
- `/events` - `EventsHubPage` - Events hub
- `/events/:id` - `EventDetailsPage` - Event details
- `/blog` - `BlogHubPage` - Blog hub
- `/blog/article/:id` - `BlogArticlePage` - Blog article
- `/author-portal` - `AuthorPortalDashboard` - Author portal dashboard
- `/author-portal/projects` - `AuthorProjectsPage` - Author projects
- `/author-portal/submit` - `NotFoundPage` - **GAP: Author submission page not implemented**
- `/newsletter` - `NewsletterPage` - Newsletter signup
- `/about` - `AboutPage` - About page

### Placeholder Pages (using LibraryPage)
- `/audiobooks` - `LibraryPage` - **GAP: Should be dedicated audiobooks page**
- `/videos` - `LibraryPage` - **GAP: Should be dedicated videos page**
- `/magazines` - `LibraryPage` - **GAP: Should be dedicated magazines page**
- `/podcasts` - `LibraryPage` - **GAP: Should be dedicated podcasts page**
- `/documentaries` - `LibraryPage` - **GAP: Should be dedicated documentaries page**

### Placeholder Pages (using ProfilePage)
- `/bookmarks` - `ProfilePage` - **GAP: Should be dedicated bookmarks page**
- `/history` - `ProfilePage` - **GAP: Should be dedicated history page**
- `/recommendations` - `ProfilePage` - **GAP: Should be dedicated recommendations page**
- `/gift-cards` - `ProfilePage` - **GAP: Should be dedicated gift cards page**

### Not Found Pages
- `/careers` - `NotFoundPage`
- `/press` - `NotFoundPage`
- `/contact` - `NotFoundPage`
- `/help` - `NotFoundPage`
- `/accessibility` - `NotFoundPage`
- `/devices` - `NotFoundPage`
- `/terms` - `NotFoundPage`
- `/privacy` - `NotFoundPage`

### Protected Admin Pages (requireAdmin)
- `/admin` - `AdminDashboardPage` - Admin dashboard
- `/admin/books` - `AdminBooksPage` - Admin books management
- `/admin/books/new` - `AdminBookNewPage` - Create new book
- `/admin/books/:id/edit` - `BookEditPage` - Edit book

### Auth Pages (without Layout)
- `/signin` - `SignInPageV2` - Sign in page
- `/signup` - `SignInPageV2` - Sign up page (uses same component)

### Special Pages
- `/audiobooks/:audioId` - `AudiobookPlayerPage` - Audiobook player

---

## 3. Authentication Implementation

### Frontend Authentication (`client/src/context/AuthContext.jsx`)

**Provider**: `AuthProvider`
- Uses AWS Amplify v6 (`aws-amplify/auth`)
- Manages user state, access tokens, and user groups
- Syncs user with backend via `/users/sync` endpoint (if API_BASE is set)

**Key Functions**:
- `signIn(email, password)` - Sign in with email/password
- `signUp(email, password, name)` - Register new user
- `confirmSignUp(email, code)` - Confirm signup with verification code
- `signOut()` - Sign out user
- `getCurrentUser()` - Get current authenticated user
- `fetchAuthSession()` - Get fresh auth session/tokens

**Role Extraction**:
- Extracts roles from Cognito groups (`cognito:groups`)
- Checks both ID token and Access token payloads
- Supports admin role detection (`admin`, `administrator`, `super-admin`)

**Backend Sync**:
- Automatically syncs user to backend on auth state change
- Calls `POST /users/sync` with Bearer token

**Environment Variables Required**:
- `VITE_AWS_REGION`
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_USER_POOL_CLIENT_ID`
- `VITE_IDENTITY_POOL_ID`

### Backend Authentication

#### Middleware: `authCognito.js`
- Verifies AWS Cognito JWT tokens (ID or Access tokens)
- Uses `jose` library for JWT verification
- Validates issuer, algorithm (RS256), audience/client_id
- Supports scope enforcement for Access tokens
- Attaches `req.auth` object with user info

**Configuration**:
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_APP_CLIENT_ID`

#### Middleware: `auth.js`
- Legacy authentication middleware
- Uses `verifyToken` from `config/cognito.js`
- Provides `authenticateToken` and `requireAdmin` functions
- **Note**: Less comprehensive than `authCognito.js`

#### Admin Authentication (`app.js`)
- `adminAuthMiddleware` - Created dynamically based on Cognito config
- Falls back to mock admin mode if Cognito not configured
- Checks for admin roles via:
  - Cognito groups (`cognito:groups`)
  - Request headers (`x-mock-admin`, `x-mock-roles`)
  - Mock user roles

**Admin Role Names**: `admin`, `administrator`, `super-admin`

### Protected Routes
- `/api/admin/*` - All admin routes protected with `adminAuthMiddleware`
- Frontend admin pages use `ProtectedRoute` component with `requireAdmin={true}`

### Authentication Gaps
1. **No user sync endpoint**: `/users/sync` is referenced but not implemented
2. **Cart/Library routes**: No authentication required (should be user-specific)
3. **Public book creation**: `POST /api/books` has no auth requirement
4. **Mock auth fallback**: Development mode allows mock admin headers (security concern)

---

## 4. Database Models

### Core Models (from migrations)

#### Users (`users`)
- `id` (UUID, PK)
- `cognito_sub` (VARCHAR, UNIQUE) - Cognito user ID
- `email` (VARCHAR, UNIQUE)
- `username` (VARCHAR, UNIQUE)
- `full_name` (VARCHAR)
- `avatar_url` (TEXT)
- `bio` (TEXT)
- `role` (ENUM: `user`, `admin`, `moderator`)
- `subscription_tier` (ENUM: `free`, `premium`, `enterprise`)
- `subscription_expires_at` (TIMESTAMP)
- `email_verified` (BOOLEAN)
- `profile_completed` (BOOLEAN)
- `preferences` (JSONB)
- `created_at`, `updated_at`, `last_login_at` (TIMESTAMP)

#### Authors (`authors`)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `bio` (TEXT)
- `photo_url` (TEXT)
- `website_url` (TEXT)
- `social_links` (JSONB)
- `birth_date` (DATE)
- `nationality` (VARCHAR)
- `is_verified` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**Note**: Also has `authors` table with `user_id` reference (from migration 001) - **duplication**.

#### Books (`books`)
- `id` (UUID, PK)
- `title` (VARCHAR)
- `subtitle` (VARCHAR)
- `isbn` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `publisher_id` (UUID, FK to publishers)
- `publication_date` (DATE)
- `language` (VARCHAR)
- `page_count` (INTEGER)
- `word_count` (INTEGER)
- `reading_time_minutes` (INTEGER)
- `cover_url` (TEXT)
- `sample_url` (TEXT)
- `format` (ENUM: `ebook`, `audiobook`, `physical`)
- `price_cents` (INTEGER)
- `original_price_cents` (INTEGER)
- `is_featured`, `is_bestseller`, `is_new_release`, `is_on_sale` (BOOLEAN)
- `sale_ends_at` (TIMESTAMP)
- `rating` (DECIMAL 3,2)
- `rating_count` (INTEGER)
- `view_count`, `download_count` (INTEGER)
- `tags` (TEXT[])
- `metadata` (JSONB)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Categories (`categories`)
- `id` (UUID, PK)
- `name` (VARCHAR, UNIQUE)
- `slug` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `parent_id` (UUID, FK to categories) - Hierarchical categories
- `sort_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Publishers (`publishers`)
- `id` (UUID, PK)
- `name` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `logo_url` (TEXT)
- `website_url` (TEXT)
- `founded_year` (INTEGER)
- `country` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Junction Tables
- `book_authors` - Many-to-many: books ↔ authors (with `role` and `sort_order`)
- `book_categories` - Many-to-many: books ↔ categories (with `is_primary` flag)

#### User Library (`user_library`)
- `user_id` (UUID, FK)
- `book_id` (UUID, FK)
- `added_at` (TIMESTAMP)
- `progress_percent` (DECIMAL 5,2)
- `last_read_at` (TIMESTAMP)
- `reading_time_minutes` (INTEGER)
- `notes` (TEXT)
- `is_favorite` (BOOLEAN)
- `rating` (INTEGER 1-5)
- `review` (TEXT)
- `review_public` (BOOLEAN)
- Primary Key: `(user_id, book_id)`

#### Shopping Cart (`cart`)
- `user_id` (UUID, FK)
- `book_id` (UUID, FK)
- `quantity` (INTEGER)
- `added_at`, `updated_at` (TIMESTAMP)
- Primary Key: `(user_id, book_id)`

#### Orders (`orders`)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `order_number` (VARCHAR, UNIQUE)
- `status` (ENUM: `pending`, `processing`, `completed`, `cancelled`, `refunded`)
- `payment_intent_id` (VARCHAR) - Stripe payment intent
- `payment_method` (VARCHAR)
- `subtotal_cents`, `tax_cents`, `discount_cents`, `total_cents` (INTEGER)
- `currency` (VARCHAR)
- `billing_address` (JSONB)
- `payment_metadata` (JSONB)
- `notes` (TEXT)
- `processed_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

#### Order Items (`order_items`)
- `id` (UUID, PK)
- `order_id` (UUID, FK)
- `book_id` (UUID, FK)
- `quantity` (INTEGER)
- `unit_price_cents`, `total_price_cents` (INTEGER)
- `created_at` (TIMESTAMP)

#### Reviews (`reviews`)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `book_id` (UUID, FK)
- `rating` (INTEGER 1-5)
- `title` (VARCHAR)
- `content` (TEXT)
- `is_verified_purchase` (BOOLEAN)
- `helpful_votes` (INTEGER)
- `reported_count` (INTEGER)
- `is_approved` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)
- Unique constraint: `(user_id, book_id)`

#### Reading Sessions (`reading_sessions`)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `book_id` (UUID, FK)
- `started_at`, `ended_at` (TIMESTAMP)
- `duration_minutes` (INTEGER)
- `pages_read` (INTEGER)
- `progress_start`, `progress_end` (DECIMAL 5,2)
- `device_type` (VARCHAR)
- `ip_address` (INET)
- `user_agent` (TEXT)

#### Wishlists (`wishlists`)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (VARCHAR)
- `description` (TEXT)
- `is_public` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Wishlist Items (`wishlist_items`)
- `wishlist_id` (UUID, FK)
- `book_id` (UUID, FK)
- `added_at` (TIMESTAMP)
- Primary Key: `(wishlist_id, book_id)`

### Events & Blog Models (from migration 002)

#### Events (`events`)
- `id` (UUID, PK)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `event_type` (VARCHAR)
- `start_date`, `end_date` (TIMESTAMP)
- `location` (VARCHAR)
- `virtual_link` (TEXT)
- `is_virtual` (BOOLEAN)
- `capacity` (INTEGER)
- `registered_count` (INTEGER)
- `cover_image_url` (TEXT)
- `organizer_id` (UUID, FK to users)
- `is_featured`, `is_published` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Event Registrations (`event_registrations`)
- `id` (UUID, PK)
- `event_id` (UUID, FK)
- `user_id` (UUID, FK)
- `status` (VARCHAR)
- `attended` (BOOLEAN)
- `registered_at` (TIMESTAMP)
- Unique constraint: `(event_id, user_id)`

#### Book Clubs (`book_clubs`)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `cover_image_url` (TEXT)
- `creator_id` (UUID, FK to users)
- `member_count` (INTEGER)
- `is_public` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### Book Club Members (`book_club_members`)
- `id` (UUID, PK)
- `book_club_id` (UUID, FK)
- `user_id` (UUID, FK)
- `role` (VARCHAR)
- `joined_at` (TIMESTAMP)
- Unique constraint: `(book_club_id, user_id)`

#### Blog Posts (`blog_posts`)
- `id` (UUID, PK)
- `title` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `excerpt` (TEXT)
- `content` (TEXT)
- `cover_image_url` (TEXT)
- `author_id` (UUID, FK to users)
- `category` (VARCHAR)
- `tags` (TEXT[])
- `view_count` (INTEGER)
- `is_published` (BOOLEAN)
- `published_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

#### Blog Comments (`blog_comments`)
- `id` (UUID, PK)
- `post_id` (UUID, FK)
- `user_id` (UUID, FK)
- `parent_comment_id` (UUID, FK) - For nested comments
- `content` (TEXT)
- `is_edited` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Search Analytics (from migration 003)

#### Search Analytics (`search_analytics`)
- `id` (UUID, PK)
- `query` (TEXT)
- `user_id` (UUID, FK, nullable)
- `result_count` (INTEGER)
- `filters_applied` (JSONB)
- `created_at` (TIMESTAMP)

### Database Gaps
1. **No Genres table**: Migration 001 creates `genres` table, but init.sql uses `categories` - **inconsistency**
2. **No Series table**: Frontend has series pages but no database model
3. **No Newsletter subscriptions table**: Newsletter page exists but no model
4. **Cart/Library not using database**: Controllers use in-memory arrays instead of database tables

---

## 5. Obvious Gaps & Incomplete Features

### Critical Gaps

#### Authentication & Authorization
1. **Missing `/users/sync` endpoint** - Referenced in AuthContext but not implemented
2. **Cart routes unprotected** - No authentication required, uses in-memory storage
3. **Library routes unprotected** - No authentication required, uses in-memory storage
4. **Public book creation** - `POST /api/books` has no auth requirement
5. **Mock admin headers** - Development mode allows bypassing auth via headers (security risk)

#### Data Persistence
1. **Cart uses in-memory storage** - Should use `cart` database table
2. **Library uses in-memory storage** - Should use `user_library` database table
3. **Authors controller uses mock data** - Uses `data/authors.js` instead of database
4. **Books controller duplication** - Some routes use DynamoDB, others use PostgreSQL

#### Missing Backend Routes
1. **No user profile routes** - `/api/users/*` endpoints missing
2. **No wishlist routes** - Database tables exist but no API endpoints
3. **No order history routes** - Orders table exists but no user-facing endpoints
4. **No reading session tracking** - Table exists but no endpoints
5. **No event registration routes** - Events table exists but no registration API
6. **No book club routes** - Book clubs tables exist but no API
7. **No blog comment routes** - Blog comments table exists but no API
8. **No Stripe webhook handler** - Payment webhooks not handled
9. **No newsletter subscription endpoint** - Newsletter page exists but no backend

#### Missing Frontend Pages
1. **Genre detail page** - `/genres/:id` shows NotFoundPage
2. **Series detail page** - `/series/:id` shows NotFoundPage
3. **Author submission page** - `/author-portal/submit` shows NotFoundPage
4. **Dedicated content type pages** - Audiobooks, videos, magazines, podcasts, documentaries all use LibraryPage
5. **Dedicated profile sub-pages** - Bookmarks, history, recommendations, gift-cards all use ProfilePage
6. **Legal pages** - Terms, privacy, accessibility, help all show NotFoundPage

#### Database Schema Issues
1. **Genres vs Categories** - Migration creates `genres`, init.sql uses `categories` (inconsistency)
2. **Authors table duplication** - Two different authors table schemas in migrations
3. **No Series model** - Frontend expects series but no database support
4. **No Newsletter model** - Newsletter page exists but no database table

#### Integration Gaps
1. **Stripe webhook handler missing** - No endpoint to handle payment events
2. **Notion integration incomplete** - Routes exist but may need error handling improvements
3. **Search service** - Uses PostgreSQL but some controllers use DynamoDB

#### Testing & Documentation
1. **Limited test coverage** - Only a few test files exist
2. **API documentation missing** - No OpenAPI/Swagger docs
3. **Route documentation incomplete** - Some routes documented, others not

### Medium Priority Gaps

1. **React Query not implemented** - README mentions TODO for API caching
2. **PWA components not mounted** - PWAInstallPrompt exists but may not be integrated
3. **Accessibility components** - Built but may not be fully integrated
4. **Rate limiting** - Implemented but may need tuning
5. **Error handling** - Some routes have comprehensive error handling, others don't

### Low Priority / Enhancement Opportunities

1. **Caching strategy** - Redis caching exists but could be expanded
2. **Analytics** - Search analytics table exists but could be expanded
3. **Recommendations engine** - No implementation despite frontend page
4. **Gift cards** - Frontend page exists but no backend implementation
5. **Social features** - Book clubs tables exist but no UI/API

---

## Summary Statistics

- **Total Server Routes**: ~35+ routes
- **Total Client Pages**: ~40+ routes
- **Database Tables**: ~25+ tables
- **Protected Routes**: Only `/api/admin/*` (5 routes)
- **Unprotected Routes Needing Auth**: Cart (4), Library (2), Books CRUD (3)
- **Missing Backend Routes**: ~15+ endpoints
- **Missing Frontend Pages**: ~15+ pages showing NotFoundPage
- **Database Models**: Comprehensive schema but some inconsistencies

---

## Recommendations

1. **Immediate**: Implement authentication for cart/library routes and connect to database
2. **High Priority**: Create missing backend routes for user profiles, orders, wishlists
3. **High Priority**: Resolve database schema inconsistencies (genres vs categories, authors duplication)
4. **Medium Priority**: Implement missing frontend pages or remove routes
5. **Medium Priority**: Add Stripe webhook handler for payment processing
6. **Low Priority**: Add comprehensive API documentation
7. **Low Priority**: Expand test coverage

