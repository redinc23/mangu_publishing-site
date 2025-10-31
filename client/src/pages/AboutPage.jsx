import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

function AboutPage() {
  const navRef = useRef(null);
  const floatingLettersRef = useRef(null);

  useEffect(() => {
    // Create floating letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const floatingLetters = floatingLettersRef.current;
    
    if (floatingLetters) {
      // Clear existing letters
      floatingLetters.innerHTML = '';
      
      for (let i = 0; i < 50; i++) {
        const letter = document.createElement('div');
        letter.className = 'letter';
        letter.textContent = letters.charAt(Math.floor(Math.random() * letters.length));
        letter.style.left = Math.random() * 100 + '%';
        letter.style.animationDelay = Math.random() * 15 + 's';
        letter.style.fontSize = (Math.random() * 3 + 2) + 'rem';
        floatingLetters.appendChild(letter);
      }
    }

    // Nav scroll effect
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 100) {
          navRef.current.classList.add('nav-scrolled');
        } else {
          navRef.current.classList.remove('nav-scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.timeline-item, .team-member, .value-card').forEach(el => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="about-page">
      {/* Navigation */}
      <nav className="masterpiece-nav" id="mainNav" ref={navRef}>
        <Link to="/" className="logo">
          <i className="fas fa-feather-alt"></i>
          MANGU
        </Link>
        <ul className="nav-links">
          <li><Link to="/about" className="active">Our Story</Link></li>
          <li><Link to="/library">Publications</Link></li>
          <li><Link to="/authors">Authors</Link></li>
          <li><Link to="/author-portal/submit">Manuscripts</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="masterpiece-hero">
        <div className="floating-letters" id="floatingLetters" ref={floatingLettersRef}></div>
        <div className="hero-content">
          <h1 className="hero-title">Where Stories Find Their Wings</h1>
          <p className="hero-subtitle">
            Since 1969, we have been the quiet guardians of voices that need to be heard, 
            crafting literary heirlooms that transcend time
          </p>
          <a href="#chapter-1" className="btn-primary" onClick={(e) => handleSmoothScroll(e, '#chapter-1')}>
            Begin the Journey
          </a>
        </div>
      </section>

      {/* Chapter 1: The Beginning */}
      <section className="chapter" id="chapter-1">
        <div 
          className="chapter-image" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}
        ></div>
        <div className="chapter-content">
          <span className="chapter-number">Chapter One</span>
          <h2>The Humble Beginning</h2>
          <p>
            In 1969, in a small Mumbai classroom filled with the scent of chalk dust and dreams, 
            Jayanthilal Oza—a schoolteacher with a heart as vast as the ocean—founded what would 
            become a sanctuary for stories.
          </p>
          <p>
            He saw in his students' eyes a hunger not just for knowledge, but for expression. 
            With meager resources but boundless passion, he began publishing the works of young 
            writers whose voices deserved to echo beyond those classroom walls.
          </p>
          <div className="chapter-divider"></div>
          <blockquote>
            <p>
              "We do not publish books; we give wings to stories that would otherwise remain 
              caged in the hearts of their creators."
            </p>
            <cite>— Jayanthilal Oza, Founder</cite>
          </blockquote>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="chapter" style={{ background: 'var(--parchment)' }}>
        <div className="chapter-content">
          <span className="chapter-number">Our Journey</span>
          <h2>Through the Decades</h2>
          <div className="timeline-container">
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-year">1969</div>
                <div className="timeline-content">
                  <h3>The First Publication</h3>
                  <p>Published our first collection of student poetry, hand-stitched and distributed to local libraries.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">1985</div>
                <div className="timeline-content">
                  <h3>Literary Recognition</h3>
                  <p>Received our first national literary award for a novel by a previously unknown author from the slums of Mumbai.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2020</div>
                <div className="timeline-content">
                  <h3>Digital Renaissance</h3>
                  <p>Reimagined our mission for the digital age while preserving the soul of traditional storytelling.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-year">2023</div>
                <div className="timeline-content">
                  <h3>Global Reach</h3>
                  <p>Our stories now travel across continents, translated into 12 languages and touching millions of readers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2: The Team */}
      <section className="chapter">
        <div className="chapter-content">
          <span className="chapter-number">Chapter Two</span>
          <h2>The Guardians of Stories</h2>
          <p>
            Our team is a tapestry of diverse talents united by a singular passion: to discover, 
            nurture, and share extraordinary literary voices.
          </p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-image">
                <i className="fas fa-crown"></i>
              </div>
              <h3 className="member-name">Arjun Oza</h3>
              <p className="member-role">Chief Executive Officer</p>
              <p>
                Grandson of our founder, continuing the legacy with a vision that honors our 
                past while embracing the future.
              </p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <i className="fas fa-pen-fancy"></i>
              </div>
              <h3 className="member-name">Priya Sharma</h3>
              <p className="member-role">Editor-in-Chief</p>
              <p>
                With an unparalleled instinct for literary excellence, she transforms raw 
                manuscripts into polished gems.
              </p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <i className="fas fa-compass"></i>
              </div>
              <h3 className="member-name">Rohan Mehta</h3>
              <p className="member-role">Digital Director</p>
              <p>
                Bridging the timeless art of storytelling with cutting-edge technology to reach 
                new generations of readers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: Our Values */}
      <section className="chapter" style={{ background: 'var(--parchment)' }}>
        <div className="chapter-content">
          <span className="chapter-number">Chapter Three</span>
          <h2>The Principles That Guide Us</h2>
          <p>
            Our publishing philosophy is built upon foundations that have remained unchanged 
            for over half a century.
          </p>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3 className="value-title">Literary Excellence</h3>
              <p>
                We believe in the transformative power of beautifully crafted language and 
                compelling narratives.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <h3 className="value-title">Author Partnership</h3>
              <p>
                We view our relationship with authors as a sacred collaboration, nurturing 
                talent with care and respect.
              </p>
            </div>
            <div className="value-card">
              <div className="value-icon">
                <i className="fas fa-seedling"></i>
              </div>
              <h3 className="value-title">Cultural Legacy</h3>
              <p>
                We publish not for momentary trends, but for lasting impact—creating literary 
                heirlooms for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="masterpiece-footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>MANGU PUBLISHING</h3>
            <p>
              Where stories find their wings since 1969. From a humble Mumbai classroom to a 
              global literary sanctuary.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="social-link" aria-label="Goodreads">
                <i className="fab fa-goodreads"></i>
              </a>
            </div>
          </div>
          <div className="footer-column">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/library">Publications</Link></li>
              <li><Link to="/authors">Authors</Link></li>
              <li><Link to="/author-portal/submit">Manuscript Submission</Link></li>
              <li><Link to="/blog">Literary Journal</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Connect</h3>
            <ul className="footer-links">
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/press">Media Inquiries</Link></li>
              <li><Link to="/store">Bookstores</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Visit Us</h3>
            <ul className="footer-links">
              <li>Mumbai Literary House</li>
              <li>Colaba, Mumbai 400005</li>
              <li>India</li>
              <li>+91 22 1234 5678</li>
              <li>stories@mangu.publishing</li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>
            &copy; {new Date().getFullYear()} MANGU PUBLISHING. All rights reserved. | 
            Crafted with <i className="fas fa-heart" style={{ color: 'var(--gold)' }}></i> and endless stories
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;


