import { useState, useEffect } from 'react';
import './BetaBanner.css';

/**
 * Beta Banner Component
 * Displays a prominent banner at the top of the page indicating beta status
 * Allows users to submit feedback directly
 */
export default function BetaBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [showFeedback, setShowFeedback] = useState(false);

    // Check if user has dismissed the banner before
    useEffect(() => {
        const dismissed = localStorage.getItem('betaBannerDismissed');
        if (dismissed === 'true') {
            setIsVisible(false);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('betaBannerDismissed', 'true');
    };

    const handleFeedback = () => {
        setShowFeedback(true);
    };

    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        const feedback = e.target.feedback.value;
        
        // Send feedback to backend
        fetch('/api/beta/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                feedback,
                url: window.location.href,
                timestamp: new Date().toISOString()
            })
        })
        .then(res => res.json())
        .then(() => {
            alert('Thank you for your feedback!');
            setShowFeedback(false);
            e.target.reset();
        })
        .catch(err => {
            console.error('Failed to submit feedback:', err);
            alert('Failed to submit feedback. Please try again or email beta-feedback@mangu.com');
        });
    };

    if (!isVisible) {
        // Show a small beta indicator button
        return (
            <button
                className="beta-indicator"
                onClick={() => setIsVisible(true)}
                aria-label="Show beta information"
            >
                BETA
            </button>
        );
    }

    return (
        <div className="beta-banner" role="banner" aria-label="Beta version notice">
            <div className="beta-banner-content">
                <div className="beta-banner-icon">🚀</div>
                <div className="beta-banner-text">
                    <strong>Internal Beta</strong>
                    <span>You're using the beta version of MANGU Publishing. Help us improve by sharing your feedback!</span>
                </div>
                <div className="beta-banner-actions">
                    <button
                        className="beta-banner-btn beta-banner-feedback"
                        onClick={handleFeedback}
                    >
                        Give Feedback
                    </button>
                    <button
                        className="beta-banner-btn beta-banner-dismiss"
                        onClick={handleDismiss}
                        aria-label="Dismiss banner"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {showFeedback && (
                <div className="beta-feedback-modal" role="dialog" aria-labelledby="feedback-title">
                    <div className="beta-feedback-overlay" onClick={() => setShowFeedback(false)} />
                    <div className="beta-feedback-content">
                        <h2 id="feedback-title">Share Your Feedback</h2>
                        <p>Help us improve MANGU Publishing by sharing your thoughts, suggestions, or reporting issues.</p>
                        <form onSubmit={handleFeedbackSubmit}>
                            <textarea
                                name="feedback"
                                placeholder="Tell us what you think... (bugs, suggestions, what you like, what could be better)"
                                rows="6"
                                required
                                aria-label="Feedback message"
                            />
                            <div className="beta-feedback-actions">
                                <button type="submit" className="beta-feedback-submit">
                                    Submit Feedback
                                </button>
                                <button
                                    type="button"
                                    className="beta-feedback-cancel"
                                    onClick={() => setShowFeedback(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                        <p className="beta-feedback-note">
                            You can also email us at <a href="mailto:beta-feedback@mangu.com">beta-feedback@mangu.com</a>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
