// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './features/header/Header';
import Footer from './features/header/Footer';

import HomePage from './features/home/HomePage';
import LibraryPage from './features/library/LibraryPage';
import CartPage from './features/cart/CartPage';
import BookDetailsPage from './features/books/BookDetailsPage';
import AuthorPage from './features/authors/AuthorPage';
import GenresPage from './features/genres/GenresPage';
import SearchResultsPage from './features/search/SearchResultsPage';

// Admin
import AdminLayout from './features/admin/AdminLayout';
import AdminBooksPage from './features/admin/AdminBooksPage';
import AdminBookNewPage from './features/admin/AdminBookNewPage';

// Auth bits
import UserStatus from './components/UserStatus';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <>
      {/* Global Header */}
      <Header />

      {/* Signed-in status (tiny bar) */}
      <div style={{ padding: '8px 12px', fontSize: 14 }}>
        <UserStatus />
      </div>

      {/* Routes */}
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
        <Route path="/author/:id" element={<AuthorPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/search" element={<SearchResultsPage />} />

        {/* Protected (wrap element with ProtectedRoute) */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        {/* Admin: protect the parent once; children inherit protection */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="books" element={<AdminBooksPage />} />
          <Route path="books/new" element={<AdminBookNewPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Footer */}
      <Footer />
    </>
  );
};

export default App;
