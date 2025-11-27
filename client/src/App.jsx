import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { usePageTracking } from './hooks/usePageTracking';

// Layout
import Layout from './components/layout/Layout';

// Pages
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import BlogHubPage from './pages/BlogHubPage';
import EventsHubPage from './pages/EventsHubPage';
import EventDetailsPage from './pages/EventDetailsPage';
import AuthorsPage from './pages/AuthorsPage';
import AuthorDetailPage from './pages/AuthorDetailPage';
import BlogArticlePage from './pages/BlogArticlePage';
import AuthorPortalDashboard from './pages/author/AuthorPortalDashboard';
import AuthorProjectsPage from './pages/author/AuthorProjectsPage';
import SeriesPage from './pages/SeriesPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import GenresPage from './pages/GenresPage';
import GenreDetailPage from './pages/GenreDetailPage';
import BookStorePage from './pages/BookStorePage';
import NewsletterPage from './pages/NewsletterPage';
import HomePageV2 from './pages/HomePageV2';
import LibraryPageV2 from './pages/LibraryPageV2';
import BookDetailsPageV2 from './pages/BookDetailsPageV2';
import SignInPageV2 from './pages/SignInPageV2';
import ProfilePageV2 from './pages/ProfilePageV2';
import CartPageV2 from './pages/CartPageV2';
import AudiobookPlayerPage from './pages/AudiobookPlayerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBooksPage from './features/admin/AdminBooksPage';
import AdminBookNewPage from './features/admin/AdminBookNewPage';
import BookEditPage from './features/admin/BookEditPage';
import ProtectedRoute from './components/ProtectedRoute';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';

// Main App component with routing
function App() {
  // Track page views
  usePageTracking();

  return (
    <Routes>
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePageV2 />} />
        <Route path="library" element={<LibraryPageV2 />} />
        <Route path="audiobooks" element={<LibraryPage />} />
        <Route path="videos" element={<LibraryPage />} />
        <Route path="magazines" element={<LibraryPage />} />
        <Route path="podcasts" element={<LibraryPage />} />
        <Route path="documentaries" element={<LibraryPage />} />
        <Route path="audiobooks/:audioId" element={<AudiobookPlayerPage />} />
        <Route path="book/:id" element={<BookDetailsPageV2 />} />
        <Route path="profile" element={<ProfilePageV2 />} />
        <Route path="cart" element={<CartPageV2 />} />
        <Route path="bookmarks" element={<ProfilePage />} />
        <Route path="history" element={<ProfilePage />} />
        <Route path="recommendations" element={<ProfilePage />} />
        <Route path="gift-cards" element={<ProfilePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="careers" element={<NotFoundPage />} />
        <Route path="press" element={<NotFoundPage />} />
        <Route path="events" element={<EventsHubPage />} />
        <Route path="events/:id" element={<EventDetailsPage />} />
        <Route path="authors" element={<AuthorsPage />} />
        <Route path="authors/:id" element={<AuthorDetailPage />} />
        <Route path="blog" element={<BlogHubPage />} />
        <Route path="blog/article/:id" element={<BlogArticlePage />} />
        <Route path="author-portal" element={<AuthorPortalDashboard />} />
        <Route path="author-portal/projects" element={<AuthorProjectsPage />} />
        <Route path="author-portal/submit" element={<NotFoundPage />} />
        <Route path="series" element={<SeriesPage />} />
        <Route path="series/:id" element={<SeriesDetailPage />} />
        <Route path="genres" element={<GenresPage />} />
        <Route path="genres/:id" element={<GenreDetailPage />} />
        <Route path="store" element={<BookStorePage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="accessibility" element={<NotFoundPage />} />
        <Route path="devices" element={<NotFoundPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/books"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/books/new"
          element={
            <ProtectedRoute requireAdmin>
              <AdminBookNewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/books/:id/edit"
          element={
            <ProtectedRoute requireAdmin>
              <BookEditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth routes without layout */}
      <Route path="signin" element={<SignInPageV2 />} />
      <Route path="signup" element={<SignInPageV2 />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
