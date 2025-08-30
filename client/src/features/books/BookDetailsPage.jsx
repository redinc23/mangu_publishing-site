import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const BookDetailsPage = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then(res => res.json())
      .then(data => setBook(data))
      .catch(err => console.error('Failed to load book details', err));
  }, [id]);

  if (!book) {
    return <main style={{ padding: '80px 20px' }}><p>Loading book details...</p></main>;
  }

  return (
    <main style={{ padding: '80px 20px' }}>
      <h1>{book.title}</h1>
      <p><em>by {book.author}</em></p>
      <p>Genre: {book.genre} | Year: {book.year}</p>
      {book.description && <p>{book.description}</p>}
      {/* Additional book detail info can be shown here */}
    </main>
  );
};

export default BookDetailsPage;
