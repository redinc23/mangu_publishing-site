import React, { useContext } from 'react';
import { LibraryContext } from '../../context/LibraryContext';

const LibraryPage = () => {
  const { libraryItems } = useContext(LibraryContext);

  return (
    <main style={{ padding: '80px 20px' }}>
      <h1>My Library</h1>
      {libraryItems.length === 0 ? (
        <p>Your library is empty. Start adding some books!</p>
      ) : (
        <ul>
          {libraryItems.map(book => (
            <li key={book.id}>
              <strong>{book.title}</strong> by {book.author}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default LibraryPage;
