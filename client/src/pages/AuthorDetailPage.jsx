import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './AuthorDetailPage.css';

function AuthorDetailPage() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch author details
    const fetchAuthor = async () => {
      try {
        // For now, use mock data - replace with API call later
        const mockAuthor = {
          id: parseInt(id) || 1,
          name: 'Evelyn Reed',
          bio: 'Evelyn Reed is a celebrated author known for her thought-provoking narratives that explore the depths of human emotion and connection. With over 15 years of writing experience, she has published numerous bestselling novels that have touched readers worldwide.',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
          genre: 'Literary Fiction, Contemporary Romance',
          location: 'New York, USA',
          books: [
            { id: 1, title: 'The Midnight Library', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=180&h=270&q=80', series: 'Standalone' },
            { id: 2, title: 'The Seven Husbands of Evelyn Hugo', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=180&h=270&q=80', series: 'Standalone' },
            { id: 3, title: 'The Invisible Life of Addie LaRue', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=180&h=270&q=80', series: 'Standalone' },
            { id: 4, title: 'Project Hail Mary', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=180&h=270&q=80', series: 'Standalone' },
            { id: 5, title: 'The Midnight Library', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=180&h=270&q=80', series: 'Standalone' }
          ],
          social: {
            twitter: '#',
            instagram: '#',
            facebook: '#',
            website: '#'
          }
        };
        setAuthor(mockAuthor);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching author:', error);
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [id]);

  if (loading) {
    return (
      <div className="author-detail-page">
        <div className="loading">Loading author details...</div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="author-detail-page">
        <div className="error">Author not found</div>
      </div>
    );
  }

  return (
    <div className="author-detail-page">
      {/* Author Profile Header */}
      <section className="author-profile-header">
        <div className="container">
          <div className="author-profile-grid">
            <div className="author-media">
              <img src={author.image} alt={author.name} className="author-photo" />
              <div className="author-info">
                <p><strong>Location:</strong> {author.location}</p>
                <p><strong>Genre:</strong> {author.genre}</p>
                <p><strong>Books:</strong> {author.books.length}</p>
              </div>
            </div>
            <div className="author-details">
              <h1>{author.name}</h1>
              <div className="author-bio">
                <p>{author.bio}</p>
              </div>
              <div className="action-bar">
                <button className="follow-button">
                  <i className="fas fa-plus"></i> Follow Author
                </button>
                <div className="social-links">
                  <a href={author.social.twitter} aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                  <a href={author.social.instagram} aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                  <a href={author.social.facebook} aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                  <a href={author.social.website} aria-label="Website"><i className="fas fa-globe"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="books-section">
        <div className="container">
          <h2>Books by {author.name}</h2>
          
          <div className="book-carousel-wrapper">
            <div className="book-carousel-container">
              <div className="book-carousel">
                {author.books.map(book => (
                  <div key={book.id} className="book-card">
                    <Link to={`/book/${book.id}`}>
                      <img src={book.cover} alt={book.title} className="book-cover" />
                      <div className="book-card-title">{book.title}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuthorDetailPage;

