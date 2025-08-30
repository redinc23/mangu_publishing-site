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

const App = () => {
  return (
    <>
      {/* Global Header on all pages */}
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
        <Route path="/author/:id" element={<AuthorPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        {/* Redirect any unknown route to home (or a NotFound component if created) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Global Footer on all pages */}
      <Footer />
    </>
  );
};

export default App;
