import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContentPage.css';

function MagazinesPage() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/books?format=magazine');
        const data = await response.json();
        setMagazines(data.books || []);
      } catch (error) {
        console.error('Error fetching magazines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  if (loading) {
    return <div className="content-page"><div className="loading">Loading magazines...</div></div>;
  }

  return (
    <div className="content-page">
      <div className="page-hero">
        <h1>📰 Magazines</h1>
        <p>Browse our collection of digital magazines</p>
      </div>

      <div className="books-grid">
        {magazines.length === 0 ? (
          <div className="no-content">
            <p>No magazines available yet. Check back soon!</p>
          </div>
        ) : (
          magazines.map(item => (
            <Link to={`/books/${item.id}`} key={item.id} className="book-card">
              <div className="book-cover">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} />
                ) : (
                  <div className="cover-placeholder">📰</div>
                )}
              </div>
              <div className="book-info">
                <h3>{item.title}</h3>
                {item.authors && <p className="author">{Array.isArray(item.authors) ? item.authors.filter(a => a).join(', ') : item.authors}</p>}
                {item.price && <p className="price">${parseFloat(item.price).toFixed(2)}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default MagazinesPage;
