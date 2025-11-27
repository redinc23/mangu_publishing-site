import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ count = 1, type = 'card', width, height }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="skeleton-list-item">
            <div className="skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-text" />
            </div>
          </div>
        );

      case 'text':
        return <div className="skeleton-text" style={{ width, height }} />;

      case 'image':
        return <div className="skeleton-image" style={{ width, height }} />;

      case 'book-card':
        return (
          <div className="skeleton-book-card">
            <div className="skeleton-book-cover" />
            <div className="skeleton-book-info">
              <div className="skeleton-title" />
              <div className="skeleton-text short" />
            </div>
          </div>
        );

      default:
        return <div className="skeleton-box" style={{ width, height }} />;
    }
  };

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-wrapper">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
