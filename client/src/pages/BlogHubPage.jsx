import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BlogHubPage.css';

function BlogHubPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [blogPosts, setBlogPosts] = useState([
    {
      id: 1,
      title: 'The Future of Neural Networks: What\'s Next After Transformers?',
      excerpt: 'Exploring the next generation of AI architectures that could revolutionize how machines understand and process information.',
      category: 'technology',
      date: 'Oct 28, 2025',
      image: 'https://images.unsplash.com/photo-1677442135339-6b5c71d52dce?ixlib=rb-4.0.3&auto=format&fit=crop&w=1032&q=80',
      author: 'Jane Doe',
      authorAvatar: 'JD'
    },
    {
      id: 2,
      title: 'Exclusive: Dr. Elena Rodriguez on Ethical AI Development',
      excerpt: 'A conversation with one of the leading voices in AI ethics about responsibility, transparency, and the future of artificial intelligence.',
      category: 'interviews',
      date: 'Oct 25, 2025',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      author: 'Sarah Chen',
      authorAvatar: 'SC'
    },
    {
      id: 3,
      title: 'MANGU 3.0: A Revolutionary Update to Our Platform',
      excerpt: 'Discover the new features, improved interface, and AI-powered tools in our biggest update yet.',
      category: 'announcements',
      date: 'Oct 22, 2025',
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      author: 'MANGU Team',
      authorAvatar: 'MT'
    },
    {
      id: 4,
      title: 'Comparing the Top 5 AI Development Tools of 2025',
      excerpt: 'An in-depth analysis of the leading platforms for AI development, their strengths, weaknesses, and ideal use cases.',
      category: 'reviews',
      date: 'Oct 18, 2025',
      image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1032&q=80',
      author: 'Mike Johnson',
      authorAvatar: 'MJ'
    },
    {
      id: 5,
      title: 'Understanding Quantum Machine Learning: A Beginner\'s Guide',
      excerpt: 'Demystifying the complex world of quantum computing and its applications in machine learning and AI.',
      category: 'technology',
      date: 'Oct 15, 2025',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      author: 'Alex Kumar',
      authorAvatar: 'AK'
    },
    {
      id: 6,
      title: 'Building Diverse AI Teams: Perspectives from Industry Leaders',
      excerpt: 'How top companies are fostering inclusive environments to build better AI systems.',
      category: 'interviews',
      date: 'Oct 12, 2025',
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
      author: 'Lisa Park',
      authorAvatar: 'LP'
    }
  ]);

  const featuredPost = blogPosts[0];
  const popularPosts = blogPosts.slice(0, 3);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'technology', label: 'Technology' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'announcements', label: 'Announcements' }
  ];

  const filteredPosts = activeCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: '#f06292',
      interviews: '#81c784',
      reviews: '#ffb74d',
      announcements: '#4fc3f7'
    };
    return colors[category] || '#7e57c2';
  };

  return (
    <div className="blog-hub-page">
      {/* Featured Article */}
      <section className="featured-article">
        <div 
          className="featured-bg" 
          style={{ backgroundImage: `url(${featuredPost.image})` }}
        ></div>
        <div className="featured-overlay"></div>
        <div className="container">
          <div className="featured-content">
            <span 
              className="category-badge" 
              style={{ backgroundColor: getCategoryColor(featuredPost.category) }}
            >
              {featuredPost.category.toUpperCase()}
            </span>
            <h1 className="featured-title">{featuredPost.title}</h1>
            <p className="featured-excerpt">{featuredPost.excerpt}</p>
            <div className="featured-meta">
              <div className="author-avatar">{featuredPost.authorAvatar}</div>
              <div>by {featuredPost.author} | {featuredPost.date}</div>
            </div>
            <Link to={`/blog/article/${featuredPost.id}`} className="btn btn-primary">
              Continue Reading <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container">
        <div className="main-content">
          {/* Blog Feed */}
          <div className="blog-feed">
            <div className="blog-feed-header">
              <h2 className="section-title">Latest Articles</h2>
              <div className="category-filters">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-filter ${activeCategory === category.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="blog-grid">
              {filteredPosts.map(post => (
                <article key={post.id} className="blog-card">
                  <div className="card-image">
                    <img src={post.image} alt={post.title} />
                  </div>
                  <div className="card-content">
                    <span 
                      className="card-category" 
                      style={{ color: getCategoryColor(post.category) }}
                    >
                      {post.category.toUpperCase()}
                    </span>
                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-excerpt">{post.excerpt}</p>
                    <div className="card-meta">
                      <span>{post.date}</span>
                      <Link to={`/blog/article/${post.id}`} className="read-more">
                        Read More <i className="fas fa-arrow-right"></i>
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
              <h3 className="widget-title">Search Blog</h3>
              <form onSubmit={handleSearch} className="search-box">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSearch}>
                Search
              </button>
            </div>
            
            <div className="sidebar-widget">
              <h3 className="widget-title">Popular Posts</h3>
              <ul className="popular-posts">
                {popularPosts.map(post => (
                  <li key={post.id} className="popular-post">
                    <img src={post.image} alt={post.title} />
                    <div className="popular-post-content">
                      <h4>
                        <Link to={`/blog/article/${post.id}`}>{post.title}</Link>
                      </h4>
                      <div className="date">{post.date}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="sidebar-widget">
              <h3 className="widget-title">Tags</h3>
              <div className="tags">
                {['AI', 'Machine Learning', 'Technology', 'Ethics', 'Development', 'Future', 'Innovation', 'Research'].map(tag => (
                  <Link key={tag} to={`/blog?tag=${tag.toLowerCase()}`} className="tag">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="ai-assistant">
              <div className="ai-icon">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="ai-title">AI Content Assistant</h3>
              <p className="ai-text">
                Our AI can help you find exactly what you're looking for or suggest personalized content.
              </p>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', width: '100%' }}>
                Try AI Assistant
              </button>
            </div>
          </aside>
        </div>
        
        {/* Pagination */}
        <div className="pagination">
          <button className="page-number active">1</button>
          <button className="page-number">2</button>
          <button className="page-number">3</button>
          <button className="page-number">4</button>
          <button className="page-number">5</button>
          <button className="page-number">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BlogHubPage;


