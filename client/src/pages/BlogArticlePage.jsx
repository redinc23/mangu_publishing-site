import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BlogArticlePage.css';

function BlogArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    // Fetch article details
    const mockArticle = {
      id: parseInt(id) || 1,
      title: 'Let\'s Touch God',
      category: 'Spirituality',
      author: 'Jane Doe',
      date: 'October 15, 2025',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&h=600&q=80',
      content: `
        <p>In a world filled with constant noise and distractions, finding moments of true connection can feel like an impossible task. Yet, the pursuit of touching something divine, something greater than ourselves, remains a universal human longing.</p>
        
        <p>This journey isn't about religion or dogma—it's about discovering the sacred in the ordinary, the infinite in the finite, the divine spark that exists within each of us.</p>
        
        <h2>The Path to Connection</h2>
        
        <p>When we speak of "touching God," we're not referring to a physical act, but rather to experiencing a profound sense of unity, peace, and understanding that transcends our everyday consciousness.</p>
        
        <p>This connection can manifest in countless ways:</p>
        
        <ul>
          <li>Through meditation and mindfulness practices</li>
          <li>In moments of deep gratitude and appreciation</li>
          <li>While creating art or experiencing beauty</li>
          <li>During acts of service and compassion</li>
          <li>Through intimate relationships and authentic connections</li>
        </ul>
        
        <h2>Finding the Sacred in Everyday Life</h2>
        
        <p>The divine isn't reserved for special places or sacred texts—it's present in every moment, every breath, every interaction. When we learn to recognize it, our entire perception of reality shifts.</p>
        
        <p>This recognition isn't about changing the world around us, but about changing how we see it. It's about finding wonder in the mundane, seeing beauty in the broken, and recognizing love in the most unexpected places.</p>
      `
    };
    
    setArticle(mockArticle);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="blog-article-page">
        <div className="loading">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="blog-article-page">
        <div className="error">Article not found</div>
      </div>
    );
  }

  return (
    <div className="blog-article-page">
      {/* Reading Progress Bar */}
      <div className="reading-progress">
        <div className="reading-progress-bar" style={{ width: `${readingProgress}%` }}></div>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/blog">Blog</Link> / <span>{article.category}</span> / <span>{article.title}</span>
      </div>

      {/* Article Container */}
      <article className="article-container">
        <div className="article-header">
          <span className="category-label">{article.category}</span>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="author">By {article.author}</span>
            <span className="meta-divider">•</span>
            <span>{article.date}</span>
            <span className="meta-divider">•</span>
            <span>{article.readTime}</span>
          </div>
        </div>

        <div className="featured-image">
          <img src={article.image} alt={article.title} />
        </div>

        <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }}></div>

        {/* Article Footer */}
        <div className="article-footer">
          <div className="article-tags">
            <span className="tag">Spirituality</span>
            <span className="tag">Personal Growth</span>
            <span className="tag">Mindfulness</span>
          </div>
          <div className="article-share">
            <span>Share:</span>
            <a href="#" aria-label="Share on Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Share on Facebook"><i className="fab fa-facebook"></i></a>
            <a href="#" aria-label="Share on LinkedIn"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="related-articles">
        <div className="container">
          <h2>Related Articles</h2>
          <div className="related-grid">
            <article className="related-card">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=250&q=80" alt="Related article" />
              <h3>Finding Peace in Chaos</h3>
              <p>Learn how to maintain inner calm during life's most challenging moments.</p>
            </article>
            <article className="related-card">
              <img src="https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=400&h=250&q=80" alt="Related article" />
              <h3>The Power of Gratitude</h3>
              <p>Discover how practicing gratitude can transform your perspective on life.</p>
            </article>
            <article className="related-card">
              <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&h=250&q=80" alt="Related article" />
              <h3>Mindful Living Guide</h3>
              <p>A practical guide to incorporating mindfulness into your daily routine.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BlogArticlePage;

