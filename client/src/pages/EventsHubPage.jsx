import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './EventsHubPage.css';

function EventsHubPage() {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events] = useState([
    {
      id: 1,
      title: 'Summer Reading Challenge 2025',
      description: 'Join thousands of readers worldwide in our annual summer reading challenge.',
      date: 'June 1 - Aug 31, 2025',
      time: 'All Day Event',
      category: 'challenge',
      status: 'upcoming',
      attendees: 2847,
      featured: true
    },
    {
      id: 2,
      title: 'Author Q&A: Sarah J. Maas',
      description: 'Live virtual event with bestselling fantasy author Sarah J. Maas.',
      date: 'July 15, 2025',
      time: '7:00 PM EST',
      category: 'author-event',
      status: 'upcoming',
      attendees: 1523
    },
    {
      id: 3,
      title: 'Virtual Book Club: A Court of Thorns and Roses',
      description: 'Monthly book club discussion for ACOTAR series fans.',
      date: 'July 8, 2025',
      time: '6:00 PM EST',
      category: 'bookclub',
      status: 'upcoming',
      attendees: 456
    },
    {
      id: 4,
      title: 'Romance Writers Workshop',
      description: 'Learn from published romance authors about craft and industry.',
      date: 'July 22, 2025',
      time: '2:00 PM EST',
      category: 'workshop',
      status: 'upcoming',
      attendees: 234
    },
    {
      id: 5,
      title: 'Fantasy Book Launch: The Last Kingdom',
      description: 'Celebrate the release of the most anticipated fantasy novel of the year.',
      date: 'June 20, 2025',
      time: '8:00 PM EST',
      category: 'launch',
      status: 'past',
      attendees: 892
    },
    {
      id: 6,
      title: 'Thriller Reading Marathon',
      description: 'Non-stop thriller reading sessions with live commentary.',
      date: 'June 5, 2025',
      time: '12:00 PM - 12:00 AM',
      category: 'reading-event',
      status: 'past',
      attendees: 678
    }
  ]);

  const featuredEvent = events.find(event => event.featured) || events[0];
  const upcomingEvents = events.filter(event => event.status === 'upcoming').slice(0, 3);

  const categories = [
    { id: 'all', label: 'All Events', icon: 'fa-calendar' },
    { id: 'challenge', label: 'Challenges', icon: 'fa-trophy' },
    { id: 'author-event', label: 'Author Events', icon: 'fa-user' },
    { id: 'bookclub', label: 'Book Clubs', icon: 'fa-users' },
    { id: 'workshop', label: 'Workshops', icon: 'fa-chalkboard-teacher' },
    { id: 'launch', label: 'Book Launches', icon: 'fa-rocket' },
    { id: 'reading-event', label: 'Reading Events', icon: 'fa-book-open' }
  ];

  const filters = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past Events' },
    { id: 'all', label: 'All' }
  ];

  const filteredEvents = events.filter(event => {
    const statusMatch = activeFilter === 'all' || event.status === activeFilter;
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    return statusMatch && categoryMatch;
  });

  const getCategoryColor = (category) => {
    const colors = {
      challenge: '#4CAF50',
      'author-event': '#6d4cff',
      bookclub: '#FF9800',
      workshop: '#2196F3',
      launch: '#E91E63',
      'reading-event': '#9C27B0'
    };
    return colors[category] || '#7e57c2';
  };

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.id === category)?.label || category;
  };

  return (
    <div className="events-hub-page">
      {/* Featured Event */}
      <section className="featured-event">
        <div className="featured-overlay"></div>
        <div className="container">
          <div className="featured-content">
            <span
              className="event-badge"
              style={{ backgroundColor: getCategoryColor(featuredEvent.category) }}
            >
              <i className="fas fa-star"></i> FEATURED EVENT
            </span>
            <h1 className="featured-title">{featuredEvent.title}</h1>
            <p className="featured-description">{featuredEvent.description}</p>
            <div className="featured-meta">
              <div className="meta-item">
                <i className="fas fa-calendar"></i>
                <span>{featuredEvent.date}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-clock"></i>
                <span>{featuredEvent.time}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-users"></i>
                <span>{featuredEvent.attendees} Attending</span>
              </div>
            </div>
            <div className="featured-actions">
              <button className="btn btn-primary">
                <i className="fas fa-calendar-check"></i> RSVP Now
              </button>
              <Link to={`/events/${featuredEvent.id}`} className="btn btn-secondary">
                <i className="fas fa-info-circle"></i> Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        {/* Reading Challenge Banner */}
        <section className="reading-challenge-banner">
          <div className="challenge-content">
            <div className="challenge-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="challenge-info">
              <h2>2025 Reading Challenge</h2>
              <p>Set your reading goal and track your progress throughout the year!</p>
              <div className="challenge-stats">
                <div className="stat">
                  <span className="stat-value">32</span>
                  <span className="stat-label">Books Read</span>
                </div>
                <div className="stat">
                  <span className="stat-value">50</span>
                  <span className="stat-label">Goal</span>
                </div>
                <div className="stat">
                  <span className="stat-value">64%</span>
                  <span className="stat-label">Complete</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '64%' }}></div>
              </div>
            </div>
            <button className="btn btn-challenge">
              <i className="fas fa-eye"></i> View Challenge
            </button>
          </div>
        </section>

        <div className="main-content">
          {/* Events Feed */}
          <div className="events-feed">
            <div className="events-feed-header">
              <h2 className="section-title">
                <i className="fas fa-calendar-alt"></i> Events Calendar
              </h2>
              <div className="filter-tabs">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="category-filters">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <i className={`fas ${category.icon}`}></i>
                  {category.label}
                </button>
              ))}
            </div>

            <div className="events-grid">
              {filteredEvents.map(event => (
                <article key={event.id} className="event-card">
                  <div
                    className="event-category-badge"
                    style={{ backgroundColor: getCategoryColor(event.category) }}
                  >
                    {getCategoryLabel(event.category)}
                  </div>
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <span>{event.date}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <span>{event.time}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-users"></i>
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <button className="btn-rsvp">
                        <i className="fas fa-calendar-check"></i> RSVP
                      </button>
                      <Link to={`/events/${event.id}`} className="btn-details">
                        Details <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-widget">
              <h3 className="widget-title">
                <i className="fas fa-fire"></i> Upcoming Events
              </h3>
              <ul className="upcoming-events-list">
                {upcomingEvents.map(event => (
                  <li key={event.id} className="upcoming-event">
                    <div className="event-date-badge">
                      <div className="month">{event.date.split(' ')[0]}</div>
                      <div className="day">{event.date.split(' ')[1]?.replace(',', '') || '1'}</div>
                    </div>
                    <div className="upcoming-event-content">
                      <h4>
                        <Link to={`/events/${event.id}`}>{event.title}</Link>
                      </h4>
                      <div className="event-time">
                        <i className="fas fa-clock"></i> {event.time}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-widget">
              <h3 className="widget-title">
                <i className="fas fa-users"></i> Popular Book Clubs
              </h3>
              <ul className="bookclub-list">
                <li className="bookclub-item">
                  <div className="bookclub-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="bookclub-info">
                    <h4>Fantasy Lovers Club</h4>
                    <p>1,234 members</p>
                  </div>
                  <button className="btn-join">Join</button>
                </li>
                <li className="bookclub-item">
                  <div className="bookclub-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="bookclub-info">
                    <h4>Romance Readers</h4>
                    <p>987 members</p>
                  </div>
                  <button className="btn-join">Join</button>
                </li>
                <li className="bookclub-item">
                  <div className="bookclub-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="bookclub-info">
                    <h4>Thriller Enthusiasts</h4>
                    <p>765 members</p>
                  </div>
                  <button className="btn-join">Join</button>
                </li>
              </ul>
            </div>

            <div className="create-event-widget">
              <div className="create-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <h3 className="create-title">Create Your Own Event</h3>
              <p className="create-text">
                Host your own book club, reading challenge, or author event!
              </p>
              <button className="btn btn-create">
                <i className="fas fa-calendar-plus"></i> Create Event
              </button>
            </div>
          </aside>
        </div>

        {/* Blog Articles Section */}
        <section className="blog-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-blog"></i> From the Blog
            </h2>
            <Link to="/blog" className="view-all">
              View All Articles <i className="fas fa-chevron-right"></i>
            </Link>
          </div>
          <div className="articles-grid">
            <article className="article-card">
              <div className="article-icon">
                <i className="fas fa-feather-alt"></i>
              </div>
              <div className="article-content">
                <h3 className="article-title">The Rise of Romantasy: Blending Romance and Fantasy</h3>
                <p className="article-excerpt">
                  Explore how authors are successfully merging fantasy world-building with romantic plotlines.
                </p>
                <div className="article-meta">
                  <span>June 12, 2025</span>
                  <span>8 min read</span>
                </div>
              </div>
            </article>
            <article className="article-card">
              <div className="article-icon">
                <i className="fas fa-book-reader"></i>
              </div>
              <div className="article-content">
                <h3 className="article-title">How to Build a Consistent Reading Habit</h3>
                <p className="article-excerpt">
                  Practical tips from avid readers on making time for books in your busy schedule.
                </p>
                <div className="article-meta">
                  <span>June 5, 2025</span>
                  <span>6 min read</span>
                </div>
              </div>
            </article>
            <article className="article-card">
              <div className="article-icon">
                <i className="fas fa-award"></i>
              </div>
              <div className="article-content">
                <h3 className="article-title">Summer 2025 Most Anticipated Releases</h3>
                <p className="article-excerpt">
                  Our curated list of the hottest upcoming book releases across genres.
                </p>
                <div className="article-meta">
                  <span>May 28, 2025</span>
                  <span>10 min read</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EventsHubPage;

