import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './GenresPage.css';

function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genres] = useState([
    {
      id: 1,
      name: 'Fantasy',
      description: 'Epic tales of magic, dragons, and adventure',
      count: 234,
      color: '#8a2be2',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 2,
      name: 'Science Fiction',
      description: 'Futuristic worlds and technological wonders',
      count: 187,
      color: '#00bcd4',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 3,
      name: 'Mystery',
      description: 'Crime, suspense, and thrilling investigations',
      count: 156,
      color: '#e91e63',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 4,
      name: 'Romance',
      description: 'Love stories that warm the heart',
      count: 289,
      color: '#ff6b6b',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 5,
      name: 'Thriller',
      description: 'Heart-pounding suspense and action',
      count: 145,
      color: '#f44336',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 6,
      name: 'Horror',
      description: 'Tales that send chills down your spine',
      count: 98,
      color: '#212121',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 7,
      name: 'Historical Fiction',
      description: 'Stories set in the past',
      count: 167,
      color: '#795548',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    },
    {
      id: 8,
      name: 'Literary Fiction',
      description: 'Thought-provoking and beautifully written',
      count: 201,
      color: '#607d8b',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&h=400&q=80'
    }
  ]);

  return (
    <div className="genres-page">
      {/* Hero Section */}
      <section className="genres-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Browse Genres</h1>
          <p className="hero-subtitle">Discover stories across all genres</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="genres-grid">
          {genres.map(genre => (
            <Link
              key={genre.id}
              to={`/genres/${genre.id}`}
              className="genre-card"
              onMouseEnter={() => setSelectedGenre(genre.id)}
              onMouseLeave={() => setSelectedGenre(null)}
              style={{ '--genre-color': genre.color }}
            >
              <div className="genre-image">
                <img src={genre.image} alt={genre.name} />
                <div className="genre-overlay"></div>
              </div>
              <div className="genre-info">
                <h3 className="genre-name">{genre.name}</h3>
                <p className="genre-description">{genre.description}</p>
                <div className="genre-count">
                  <i className="fas fa-book"></i> {genre.count} Books
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GenresPage;

