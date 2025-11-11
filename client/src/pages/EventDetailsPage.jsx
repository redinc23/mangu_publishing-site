import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './EventDetailsPage.css';

function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState('not_rsvped');

  useEffect(() => {
    // Fetch event details
    const mockEvent = {
      id: parseInt(id) || 1,
      title: 'Summer Reading Challenge 2025',
      description: 'Join thousands of readers worldwide in our annual summer reading challenge. Complete reading goals, unlock achievements, and connect with fellow book lovers.',
      date: 'June 1, 2025',
      time: 'All Day Event',
      endDate: 'August 31, 2025',
      location: 'Online',
      category: 'challenge',
      attendees: 2847,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&h=600&q=80',
      organizer: 'MANGU Publishing',
      tags: ['Reading Challenge', 'Community', 'Summer'],
      agenda: [
        { time: '9:00 AM', item: 'Welcome & Introduction' },
        { time: '9:30 AM', item: 'Reading Goals Discussion' },
        { time: '10:00 AM', item: 'Breakout Sessions' },
        { time: '12:00 PM', item: 'Lunch Break' },
        { time: '1:00 PM', item: 'Author Q&A' },
        { time: '3:00 PM', item: 'Closing Remarks' }
      ],
      speakers: [
        { name: 'Sarah J. Maas', role: 'Bestselling Author' },
        { name: 'Brandon Sanderson', role: 'Fantasy Writer' }
      ]
    };
    
    setEvent(mockEvent);
    setLoading(false);
  }, [id]);

  const handleRSVP = () => {
    setRsvpStatus('rsvped');
  };

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <div className="error">Event not found</div>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      {/* Hero Section */}
      <section className="event-hero">
        <div className="hero-background" style={{ backgroundImage: `url(${event.image})` }}></div>
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <span className="event-badge">{event.category.toUpperCase()}</span>
            <h1 className="event-title">{event.title}</h1>
            <div className="event-hero-meta">
              <div className="meta-item">
                <i className="fas fa-calendar"></i>
                <span>{event.date} - {event.endDate}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-clock"></i>
                <span>{event.time}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>{event.location}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-users"></i>
                <span>{event.attendees} Attending</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="event-content-grid">
          {/* Main Content */}
          <div className="event-main">
            {/* Description */}
            <section className="event-section">
              <h2>About This Event</h2>
              <p className="event-description">{event.description}</p>
            </section>

            {/* Agenda */}
            {event.agenda && event.agenda.length > 0 && (
              <section className="event-section">
                <h2>Event Agenda</h2>
                <div className="agenda-list">
                  {event.agenda.map((item, index) => (
                    <div key={index} className="agenda-item">
                      <div className="agenda-time">{item.time}</div>
                      <div className="agenda-content">{item.item}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <section className="event-section">
                <h2>Featured Speakers</h2>
                <div className="speakers-grid">
                  {event.speakers.map((speaker, index) => (
                    <div key={index} className="speaker-card">
                      <div className="speaker-avatar">
                        {speaker.name.charAt(0)}
                      </div>
                      <h3>{speaker.name}</h3>
                      <p>{speaker.role}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="event-sidebar">
            <div className="rsvp-card">
              {rsvpStatus === 'rsvped' ? (
                <div className="rsvp-confirmed">
                  <i className="fas fa-check-circle"></i>
                  <h3>You're Attending!</h3>
                  <p>We'll send you reminders as the event approaches.</p>
                </div>
              ) : (
                <>
                  <h3>Join This Event</h3>
                  <p>{event.attendees} people are attending</p>
                  <button className="btn btn-primary" onClick={handleRSVP}>
                    <i className="fas fa-calendar-check"></i> RSVP Now
                  </button>
                </>
              )}
            </div>

            <div className="info-card">
              <h3>Event Details</h3>
              <div className="info-item">
                <strong>Date:</strong>
                <span>{event.date} - {event.endDate}</span>
              </div>
              <div className="info-item">
                <strong>Time:</strong>
                <span>{event.time}</span>
              </div>
              <div className="info-item">
                <strong>Location:</strong>
                <span>{event.location}</span>
              </div>
              <div className="info-item">
                <strong>Organizer:</strong>
                <span>{event.organizer}</span>
              </div>
            </div>

            <div className="tags-card">
              <h3>Tags</h3>
              <div className="tags-list">
                {event.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPage;

