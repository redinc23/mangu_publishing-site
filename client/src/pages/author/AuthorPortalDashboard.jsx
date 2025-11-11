import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AuthorPortalDashboard.css';

function AuthorPortalDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects] = useState([
    {
      id: 1,
      title: 'The Midnight Chronicles',
      status: 'under-review',
      lastModified: '2025-01-15',
      submissions: 3,
      views: 1247
    },
    {
      id: 2,
      title: 'Desert Dreams',
      status: 'submitted',
      lastModified: '2025-01-10',
      submissions: 1,
      views: 892
    },
    {
      id: 3,
      title: 'Neon Nights',
      status: 'draft',
      lastModified: '2025-01-08',
      submissions: 0,
      views: 0
    },
    {
      id: 4,
      title: 'Ocean\'s Whisper',
      status: 'published',
      lastModified: '2024-12-20',
      submissions: 5,
      views: 5643
    }
  ]);

  const stats = {
    totalProjects: projects.length,
    published: projects.filter(p => p.status === 'published').length,
    inReview: projects.filter(p => p.status === 'under-review').length,
    drafts: projects.filter(p => p.status === 'draft').length
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'draft': 'status-draft',
      'submitted': 'status-submitted',
      'under-review': 'status-under-review',
      'accepted': 'status-accepted',
      'published': 'status-published'
    };
    return statusMap[status] || 'status-draft';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under-review': 'Under Review',
      'accepted': 'Accepted',
      'published': 'Published'
    };
    return labelMap[status] || status;
  };

  return (
    <div className="author-portal-dashboard">
      {/* Portal Header */}
      <header className="portal-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="portal-logo">
              <i className="fas fa-feather-alt"></i> MANGU Author Portal
            </Link>
            <nav className="nav-tabs">
              <Link to="/author-portal" className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/author-portal/projects" className="nav-tab">
                My Projects
              </Link>
              <Link to="/author-portal/submit" className="nav-tab">
                Submit Manuscript
              </Link>
            </nav>
            <div className="author-profile">
              <div className="author-avatar">JD</div>
              <span>John Doe</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <Link to="/author-portal/submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> New Project
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-book"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalProjects}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon published">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.published}</div>
              <div className="stat-label">Published</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon review">
              <i className="fas fa-eye"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.inReview}</div>
              <div className="stat-label">In Review</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon draft">
              <i className="fas fa-edit"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.drafts}</div>
              <div className="stat-label">Drafts</div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <section className="recent-projects">
          <div className="section-header">
            <h2>Recent Projects</h2>
            <Link to="/author-portal/projects" className="view-all-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th>Submissions</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <Link to={`/author-portal/projects/${project.id}`} className="project-title">
                        {project.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td>{new Date(project.lastModified).toLocaleDateString()}</td>
                    <td>{project.submissions}</td>
                    <td>{project.views.toLocaleString()}</td>
                    <td>
                      <div className="actions">
                        <button className="action-btn" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="action-btn" title="View">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="action-btn" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/author-portal/submit" className="action-card">
              <i className="fas fa-file-upload"></i>
              <h3>Submit New Manuscript</h3>
              <p>Upload your latest work for review</p>
            </Link>
            <Link to="/author-portal/projects" className="action-card">
              <i className="fas fa-folder-open"></i>
              <h3>Manage Projects</h3>
              <p>View and edit all your projects</p>
            </Link>
            <Link to="/author-portal/profile" className="action-card">
              <i className="fas fa-user-circle"></i>
              <h3>Update Profile</h3>
              <p>Edit your author profile information</p>
            </Link>
            <Link to="/author-portal/analytics" className="action-card">
              <i className="fas fa-chart-line"></i>
              <h3>View Analytics</h3>
              <p>Track your publication performance</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthorPortalDashboard;

