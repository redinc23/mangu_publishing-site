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
// Add these new imports for the Admin section
import AdminLayout from './features/admin/AdminLayout';
import AdminBooksPage from './features/admin/AdminBooksPage';
import AdminBookNewPage from './features/admin/AdminBookNewPage';

const App = () => {
  return (
    <>
      {/* Global Header on all pages */}
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
        <Route path="/author/:id" element={<AuthorPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        
        {/* Admin Routes - Nested under a common layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="books" element={<AdminBooksPage />} />
           <Route path="books/new" element={<AdminBookNewPage />} />
          {/* We'll add more admin routes like `authors` later */}
        </Route>
        
        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Global Footer on all pages */}
      <Footer />
    </>
  );
};

export default App;