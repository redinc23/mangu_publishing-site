import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './EventsHubPage.css';

function EventsHubPage() {
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sample events data
  const [events] = useState([
    {
      id: 1,
      title: 'Summer Reading Challenge 2025',
      description: 'Join thousands of readers in our annual summer reading challenge! Read 10 books over the summer and unlock exclusive rewards.',
      category: 'challenges',
      date: 'June 1, 2025',
      time: '9:00 AM',
      attendees: 1234,
      status: 'upcoming',
      featured: true
    },
    {
      id: 2,
      title: 'Author Meet & Greet: Sarah Johnson',
      description: 'Meet bestselling author Sarah Johnson and get your books signed. Discussion panel and Q&A session included.',
      category: 'author-events',
      date: 'June 15, 2025',
      time: '2:00 PM',
      attendees: 567,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'Fantasy Book Club Meeting',
      description: 'Monthly meeting of the Fantasy Lovers Club. This month we\'re discussing "The Shadow King" by Mark Williams.',
      category: 'book-clubs',
      date: 'June 8, 2025',
      time: '7:00 PM',
      attendees: 89,
      status: 'upcoming'
    },
    {
      id: 4,
      title: 'Writing Workshop: Character Development',
      description: 'Learn advanced techniques for creating compelling characters in your stories. Led by award-winning author Dr. Emily Chen.',
      category: 'workshops',
      date: 'June 12, 2025',
      time: '10:00 AM',
      attendees: 234,
      status: 'upcoming'
    },
    {
      id: 5,
      title: 'Book Launch: "The Last Horizon"',
      description: 'Celebrate the launch of the highly anticipated new novel by bestselling author Michael Torres.',
      category: 'book-launches',
      date: 'June 20, 2025',
      time: '6:00 PM',
      attendees: 890,
      status: 'upcoming'
    },
    {
      id: 6,
      title: 'Silent Reading Night',
      description: 'Join fellow book lovers for a peaceful evening of silent reading. Bring your favorite book and enjoy quiet camaraderie.',
      category: 'reading-events',
      date: 'June 5, 2025',
      time: '6:00 PM',
      attendees: 456,
      status: 'upcoming'
    },
    {
      id: 7,
      title: 'Book Club Discussion: "The Midnight Library"',
      description: 'Join our discussion of this thought-provoking novel about life, choices, and second chances.',
      category: 'book-clubs',
      date: 'May 25, 2025',
      time: '7:00 PM',
      attendees: 123,
      status: 'past'
    }
  ]);

  const featuredEvent = events.find(e => e.featured) || events[0];
  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 5);

  const getCategoryColor = (category) => {
    const colors = {
      'challenges': '#ff6b6b',
      'author-events': '#4ecdc4',
      'book-clubs': '#95e1d3',
      'workshops': '#f38181',
      'book-launches': '#fce38a',
      'reading-events': '#aa96da'
    };
    return colors[category] || '#7e57c2';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'challenges': 'Challenge',
      'author-events': 'Author Event',
      'book-clubs': 'Book Club',
      'workshops': 'Workshop',
      'book-launches': 'Book Launch',
      'reading-events': 'Reading Event'
    };
    return labels[category] || 'Event';
  };

  const filteredEvents = events.filter(event => {
    const statusMatch = statusFilter === 'all' || event.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || event.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  return (
    <div className="events-hub-page">
      {/* Featured Event Section */}
      <section className="featured-event-section">
        <div 
          className="featured-event-bg"
          style={{
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        ></div>
        <div className="featured-event-overlay"></div>
        <div className="container">
          <div className="featured-event-content">
            <div className="featured-badge">
              <i className="fas fa-star"></i> Featured Event
            </div>
            <h1 className="featured-event-title">{featuredEvent.title}</h1>
            <p className="featured-event-description">{featuredEvent.description}</p>
            <div className="featured-event-details">
              <div className="featured-detail-item">
                <i className="fas fa-calendar"></i>
                <span>{featuredEvent.date}</span>
              </div>
              <div className="featured-detail-item">
                <i className="fas fa-clock"></i>
                <span>{featuredEvent.time}</span>
              </div>
              <div className="featured-detail-item">
                <i className="fas fa-users"></i>
                <span>{featuredEvent.attendees} attending</span>
              </div>
            </div>
            <div className="featured-event-actions">
              <button className="btn btn-primary btn-featured">
                <i className="fas fa-calendar-check"></i> RSVP Now
              </button>
              <Link to={`/events/${featuredEvent.id}`} className="btn btn-secondary btn-featured">
                Learn More <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reading Challenge Banner */}
      <section className="challenge-banner">
        <div className="container">
          <div className="challenge-content">
            <div className="challenge-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="challenge-text">
              <h2>2025 Reading Challenge</h2>
              <p>Join 50,000+ readers in our annual challenge</p>
            </div>
            <div className="challenge-stats">
              <div className="stat-item">
                <div className="stat-value">50K+</div>
                <div className="stat-label">Participants</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">2.5M</div>
                <div className="stat-label">Books Read</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">85%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
            <button className="btn btn-challenge">
              Join Challenge <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="events-main-content">
          {/* Events Feed */}
          <div className="events-feed">
            {/* Filters */}
            <div className="events-filters">
              <div className="status-filters">
                <button
                  className={`status-filter ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All Events
                </button>
                <button
                  className={`status-filter ${statusFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={`status-filter ${statusFilter === 'past' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('past')}
                >
                  Past Events
                </button>
              </div>
              <div className="category-filters">
                <button
                  className={`category-filter ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  All Categories
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'challenges' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('challenges')}
                >
                  Challenges
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'author-events' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('author-events')}
                >
                  Author Events
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'book-clubs' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('book-clubs')}
                >
                  Book Clubs
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'workshops' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('workshops')}
                >
                  Workshops
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'book-launches' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('book-launches')}
                >
                  Book Launches
                </button>
                <button
                  className={`category-filter ${categoryFilter === 'reading-events' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('reading-events')}
                >
                  Reading Events
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="events-list">
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
                      <div className="day">{event.date.split(' ')[1].replace(',', '')}</div>
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

