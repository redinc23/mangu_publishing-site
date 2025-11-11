import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthModal.module.css';

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  const { signUp, confirmSignUp } = useAuth(); // Uses our updated context

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signUp(email, password, name); // Uses context function
    
    if (result.success) {
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      } else {
        onClose();
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await confirmSignUp(email, confirmationCode); // Uses context function
    
    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
      setName('');
      setConfirmationCode('');
      setNeedsConfirmation(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div className={styles.modalHeader}>
          <h2>{needsConfirmation ? 'Confirm Your Email' : 'Create Your Account'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        {!needsConfirmation ? (
          <form onSubmit={handleSignUp} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={8}
              />
              <small>Password must be at least 8 characters</small>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmation} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            
            <p>We sent a confirmation code to {email}</p>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmationCode">Confirmation Code</label>
              <input
                id="confirmationCode"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
                placeholder="Enter confirmation code"
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Account'}
            </button>
          </form>
        )}
        
        {!needsConfirmation && (
            <div className={styles.modalFooter}>
              <p>
                Already have an account? 
                <button 
                className={styles.linkButton}
                onClick={onSwitchToLogin}
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupModal;