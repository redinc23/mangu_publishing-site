import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './BookStorePage.css';

function BookStorePage() {
  const [location, setLocation] = useState('');
  const [stores] = useState([
    {
      id: 1,
      name: 'MANGU Books Downtown',
      address: '123 Main Street, Downtown',
      city: 'New York',
      phone: '(555) 123-4567',
      hours: 'Mon-Sat: 9am-9pm, Sun: 10am-8pm',
      distance: '0.5 miles'
    },
    {
      id: 2,
      name: 'MANGU Books Mall',
      address: '456 Shopping Center Blvd',
      city: 'New York',
      phone: '(555) 234-5678',
      hours: 'Mon-Sat: 10am-10pm, Sun: 11am-9pm',
      distance: '2.3 miles'
    },
    {
      id: 3,
      name: 'MANGU Books University',
      address: '789 College Avenue',
      city: 'New York',
      phone: '(555) 345-6789',
      hours: 'Mon-Fri: 8am-8pm, Sat-Sun: 10am-6pm',
      distance: '5.1 miles'
    }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for stores near:', location);
  };

  return (
    <div className="bookstore-page">
      {/* Header */}
      <div className="page-header">
        <h1>Find a Bookstore</h1>
        <p>Locate MANGU bookstores near you</p>
      </div>

      {/* Main Content */}
      <div className="container">
        {/* Search Form */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-form-container">
            <div className="location-input">
              <input
                type="text"
                placeholder="Enter city, zip code, or address..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="location-buttons">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-search"></i> Search
              </button>
              <button type="button" className="btn btn-secondary">
                <i className="fas fa-location-arrow"></i> Use My Location
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        <div className="results-container">
          {/* Map Container */}
          <div className="map-container">
            <div className="map-placeholder">
              <i className="fas fa-map-marked-alt" style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
              <h3>Map View</h3>
              <p>Interactive map showing bookstore locations</p>
            </div>
          </div>

          {/* Store List */}
          <div className="stores-list">
            <h2 className="stores-list-title">Nearby Stores</h2>
            {stores.map(store => (
              <div key={store.id} className="store-card">
                <div className="store-header">
                  <h3 className="store-name">{store.name}</h3>
                  <span className="distance">{store.distance}</span>
                </div>
                <div className="store-info">
                  <div className="info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{store.address}, {store.city}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-phone"></i>
                    <span>{store.phone}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <span>{store.hours}</span>
                  </div>
                </div>
                <div className="store-actions">
                  <button className="btn btn-outline">
                    <i className="fas fa-directions"></i> Get Directions
                  </button>
                  <button className="btn btn-outline">
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookStorePage;

