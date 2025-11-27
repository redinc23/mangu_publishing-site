import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import BookDetailsPage from './pages/BookDetailsPage';
import ProfilePage from './pages/ProfilePage';
import SignInPage from './pages/SignInPage';
import CartPage from './pages/CartPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import BetaStatusPage from './pages/BetaStatusPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GenreDetailPage from './pages/GenreDetailPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import AuthorSubmitPage from './pages/AuthorSubmitPage';
import AudiobooksPage from './pages/AudiobooksPage';
import VideosPage from './pages/VideosPage';
import MagazinesPage from './pages/MagazinesPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';

// Main App component with routing
function App() {
  return (
    <Routes>
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="audiobooks" element={<AudiobooksPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="magazines" element={<MagazinesPage />} />
        <Route path="podcasts" element={<LibraryPage />} />
        <Route path="documentaries" element={<LibraryPage />} />
        <Route path="book/:id" element={<BookDetailsPage />} />
        <Route path="books/:id" element={<BookDetailsPage />} />
        <Route path="genres/:id" element={<GenreDetailPage />} />
        <Route path="series/:id" element={<SeriesDetailPage />} />
        <Route path="author-portal/submit" element={<AuthorSubmitPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="bookmarks" element={<ProfilePage />} />
        <Route path="history" element={<ProfilePage />} />
        <Route path="recommendations" element={<ProfilePage />} />
        <Route path="gift-cards" element={<ProfilePage />} />
        <Route path="about" element={<NotFoundPage />} />
        <Route path="careers" element={<NotFoundPage />} />
        <Route path="press" element={<NotFoundPage />} />
        <Route path="blog" element={<NotFoundPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="accessibility" element={<NotFoundPage />} />
        <Route path="devices" element={<NotFoundPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="beta/status" element={<BetaStatusPage />} />
      </Route>

      {/* Auth routes without layout */}
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignInPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
