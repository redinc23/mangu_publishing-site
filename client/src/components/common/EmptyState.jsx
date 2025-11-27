import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

const EmptyState = ({
  icon = 'fas fa-inbox',
  title = 'Nothing here yet',
  message = 'Get started by adding some items',
  actionText,
  actionLink,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <i className={icon}></i>
      </div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-message">{message}</p>
      {(actionText && actionLink) && (
        <Link to={actionLink} className="empty-state-action btn btn-primary">
          {actionText}
        </Link>
      )}
      {(actionText && onAction && !actionLink) && (
        <button onClick={onAction} className="empty-state-action btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
