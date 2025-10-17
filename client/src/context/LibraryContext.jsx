import React, { createContext, useState, useEffect } from 'react';

export const LibraryContext = createContext();

export const LibraryProvider = ({ children }) => {
  const [libraryItems, setLibraryItems] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/library')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLibraryItems(data);
        }
      })
      .catch(err => console.error('Failed to load library', err));
  }, []);

  const addToLibrary = (bookId) => {
    fetch('http://localhost:5000/api/library/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId })
    })
      .then(res => res.json())
      .then(updatedLibrary => {
        setLibraryItems(updatedLibrary);
      })
      .catch(err => console.error('Add to library failed', err));
  };

  const value = {
    libraryItems,
    addToLibrary
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
