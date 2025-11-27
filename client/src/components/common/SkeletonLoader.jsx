import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ count = 1, type = 'book-card', className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'book-card':
        return (
          <div className={`skeleton-book-card ${className}`}>
            <div className="skeleton-cover"></div>
            <div className="skeleton-info">
              <div className="skeleton-title"></div>
              <div className="skeleton-author"></div>
              <div className="skeleton-genres">
                <div className="skeleton-genre"></div>
                <div className="skeleton-genre"></div>
              </div>
              <div className="skeleton-price"></div>
            </div>
          </div>
        );

      case 'book-details':
        return (
          <div className={`skeleton-book-details ${className}`}>
            <div className="skeleton-details-cover"></div>
            <div className="skeleton-details-info">
              <div className="skeleton-details-title"></div>
              <div className="skeleton-details-subtitle"></div>
              <div className="skeleton-details-author"></div>
              <div className="skeleton-details-meta"></div>
              <div className="skeleton-details-description"></div>
              <div className="skeleton-details-description"></div>
              <div className="skeleton-details-buttons"></div>
            </div>
          </div>
        );

      case 'cart-item':
        return (
          <div className={`skeleton-cart-item ${className}`}>
            <div className="skeleton-cart-cover"></div>
            <div className="skeleton-cart-info">
              <div className="skeleton-cart-title"></div>
              <div className="skeleton-cart-author"></div>
              <div className="skeleton-cart-meta"></div>
              <div className="skeleton-cart-description"></div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className={`skeleton-profile ${className}`}>
            <div className="skeleton-profile-avatar"></div>
            <div className="skeleton-profile-info">
              <div className="skeleton-profile-name"></div>
              <div className="skeleton-profile-email"></div>
              <div className="skeleton-profile-stats"></div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`skeleton-text ${className}`}></div>
        );

      default:
        return (
          <div className={`skeleton-default ${className}`}></div>
        );
    }
  };

  return (
    <div className="skeleton-loader-container">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};

export default SkeletonLoader;
