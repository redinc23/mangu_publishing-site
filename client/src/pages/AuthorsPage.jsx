import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthorsPage.css';

function AuthorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [authors] = useState([
    {
      id: 1,
      name: 'Matt Haig',
      genre: 'Fiction, Self-Help',
      bio: 'British author known for his uplifting novels that explore mental health and the human condition.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=280&h=300&q=80',
      books: 12,
      rating: 4.7
    },
    {
      id: 2,
      name: 'Emily St. John Mandel',
      genre: 'Literary Fiction, Sci-Fi',
      bio: 'Canadian author acclaimed for her intricate storytelling and post-apocalyptic narratives.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=280&h=300&q=80',
      books: 6,
      rating: 4.5
    },
    {
      id: 3,
      name: 'Brandon Sanderson',
      genre: 'Fantasy, Sci-Fi',
      bio: 'Prolific American fantasy writer known for his intricate world-building and magic systems.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=280&h=300&q=80',
      books: 50,
      rating: 4.8
    },
    {
      id: 4,
      name: 'Celeste Ng',
      genre: 'Literary Fiction',
      bio: 'American writer whose novels explore family dynamics, identity, and the Asian-American experience.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=280&h=300&q=80',
      books: 3,
      rating: 4.6
    },
    {
      id: 5,
      name: 'Rebecca Yarros',
      genre: 'Romance, Fantasy',
      bio: 'Bestselling author of romantasy novels, known for "Fourth Wing" and captivating storytelling.',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=280&h=300&q=80',
      books: 15,
      rating: 4.9
    },
    {
      id: 6,
      name: 'Colleen Hoover',
      genre: 'Contemporary Romance',
      bio: 'New York Times bestselling author known for emotional and compelling romance novels.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=280&h=300&q=80',
      books: 25,
      rating: 4.7
    }
  ]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="authors-page">
      {/* Hero Section */}
      <section className="authors-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Meet Our Authors</h1>
          <p className="hero-subtitle">Discover the talented writers behind your favorite stories</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        {/* Featured Authors */}
        <section className="featured-authors">
          <h2 className="section-title">Featured Authors</h2>
          <div className="authors-grid">
            {authors.map(author => (
              <article key={author.id} className="author-card">
                <div className="author-image-wrapper">
                  <img src={author.image} alt={author.name} className="author-image" />
                </div>
                <div className="author-info">
                  <h3 className="author-name">{author.name}</h3>
                  <span className="author-genre">{author.genre}</span>
                  <p className="author-bio">{author.bio}</p>
                  <div className="author-stats">
                    <span>{author.books} Books</span>
                    <span>{author.rating}★ Rating</span>
                  </div>
                  <Link to={`/authors/${author.id}`} className="author-link">
                    View Profile <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Alphabetical Index */}
        <section className="alpha-index">
          <h2 className="section-title">Browse Authors A-Z</h2>
          <div className="alpha-grid">
            {alphabet.map(letter => (
              <Link
                key={letter}
                to={`/authors/a-z#${letter}`}
                className="alpha-letter"
              >
                {letter}
              </Link>
            ))}
          </div>
        </section>

        {/* View All Button */}
        <div className="view-all-authors">
          <Link to="/authors/a-z" className="btn btn-primary">
            View All Authors <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthorsPage;

