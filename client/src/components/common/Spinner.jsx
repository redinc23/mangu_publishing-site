import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium', color = 'primary', message = '' }) => {
  const sizeClass = `spinner-${size}`;
  const colorClass = `spinner-${color}`;

  return (
    <div className="spinner-container">
      <div className={`spinner ${sizeClass} ${colorClass}`}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default Spinner;
