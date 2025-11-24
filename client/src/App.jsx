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

// Main App component with routing
function App() {
  return (
    <Routes>
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="audiobooks" element={<LibraryPage />} />
        <Route path="videos" element={<LibraryPage />} />
        <Route path="magazines" element={<LibraryPage />} />
        <Route path="podcasts" element={<LibraryPage />} />
        <Route path="documentaries" element={<LibraryPage />} />
        <Route path="book/:id" element={<BookDetailsPage />} />
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
        <Route path="contact" element={<NotFoundPage />} />
        <Route path="help" element={<NotFoundPage />} />
        <Route path="accessibility" element={<NotFoundPage />} />
        <Route path="devices" element={<NotFoundPage />} />
        <Route path="terms" element={<NotFoundPage />} />
        <Route path="privacy" element={<NotFoundPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="beta/status" element={<BetaStatusPage />} />
      </Route>

      {/* Auth routes without layout */}
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignInPage />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
