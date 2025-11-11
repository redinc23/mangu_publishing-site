import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthorProjectsPage.css';

function AuthorProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projects] = useState([
    {
      id: 1,
      title: 'The Midnight Chronicles',
      status: 'published',
      lastModified: '2025-01-15',
      submissions: 3,
      views: 1247
    },
    {
      id: 2,
      title: 'Echoes of Tomorrow',
      status: 'under-review',
      lastModified: '2025-01-10',
      submissions: 1,
      views: 892
    },
    {
      id: 3,
      title: 'Whispers in the Dark',
      status: 'submitted',
      lastModified: '2025-01-08',
      submissions: 0,
      views: 0
    },
    {
      id: 4,
      title: 'Beyond the Horizon',
      status: 'draft',
      lastModified: '2025-01-05',
      submissions: 0,
      views: 0
    },
    {
      id: 5,
      title: 'Shadows of the Past',
      status: 'accepted',
      lastModified: '2025-01-03',
      submissions: 2,
      views: 456
    }
  ]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="author-projects-page">
      {/* Portal Header */}
      <header className="portal-header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="portal-logo">
              <i className="fas fa-feather-alt"></i> MANGU Author Portal
            </Link>
            <nav className="nav-tabs">
              <Link to="/author-portal" className="nav-tab">Dashboard</Link>
              <Link to="/author-portal/projects" className="nav-tab active">My Projects</Link>
              <Link to="/author-portal/submit" className="nav-tab">Submit Manuscript</Link>
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
        <div className="page-header">
          <h1 className="page-title">My Projects</h1>
          <Link to="/author-portal/submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> New Project
          </Link>
        </div>

        {/* Controls */}
        <div className="controls">
          <input
            type="text"
            className="search-box"
            placeholder="Search by project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search projects"
          />
          <div className="filters">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under-review">Under Review</option>
              <option value="accepted">Accepted</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
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
              {filteredProjects.map(project => (
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
                      {project.status !== 'published' && (
                        <button className="action-btn" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <h3>No projects found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthorProjectsPage;

