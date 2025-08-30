import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const AuthorPage = () => {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    // Fetch author details if an endpoint existed (for now, use featured authors list)
    fetch('/api/authors/featured')
      .then(res => res.json())
      .then(data => {
        const found = data.find(a => String(a.id) === id);
        if (found) setAuthor(found);
      })
      .catch(err => console.error('Failed to load author', err));
  }, [id]);

  if (!author) {
    return <main style={{ padding: '80px 20px' }}><p>Loading author...</p></main>;
  }

  return (
    <main style={{ padding: '80px 20px' }}>
      <h1>{author.name}</h1>
      <p>Genre: {author.genre}</p>
      <p>Average Rating: ★ {author.rating} &nbsp;•&nbsp; Books Published: {author.bookCount}</p>
      {/* Additional author info and book list could go here */}
    </main>
  );
};

export default AuthorPage;
