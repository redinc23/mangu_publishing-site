import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ContentPage.css';

function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/books?format=video');
        const data = await response.json();
        setVideos(data.books || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div className="content-page"><div className="loading">Loading videos...</div></div>;
  }

  return (
    <div className="content-page">
      <div className="page-hero">
        <h1>📹 Videos</h1>
        <p>Educational and entertaining video content</p>
      </div>

      <div className="books-grid">
        {videos.length === 0 ? (
          <div className="no-content">
            <p>No videos available yet. Check back soon!</p>
          </div>
        ) : (
          videos.map(item => (
            <Link to={`/books/${item.id}`} key={item.id} className="book-card">
              <div className="book-cover">
                {item.cover_url ? (
                  <img src={item.cover_url} alt={item.title} />
                ) : (
                  <div className="cover-placeholder">▶️</div>
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

export default VideosPage;
