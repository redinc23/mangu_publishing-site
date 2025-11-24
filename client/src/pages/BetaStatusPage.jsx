import { useEffect, useState } from 'react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import './BetaStatusPage.css';

/**
 * Beta Status Page
 * Shows system status, enabled features, and provides quick access to beta resources
 */
export default function BetaStatusPage() {
    const { features, beta, environment, version, isLoading } = useFeatureFlags();
    const [healthStatus, setHealthStatus] = useState(null);

    useEffect(() => {
        // Fetch health status
        fetch('/api/health')
            .then(res => res.json())
            .then(data => setHealthStatus(data))
            .catch(err => console.error('Failed to fetch health status:', err));
    }, []);

    if (isLoading) {
        return (
            <div className="beta-status-page">
                <div className="beta-status-loading">Loading beta information...</div>
            </div>
        );
    }

    const enabledFeatures = Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);

    const disabledFeatures = Object.entries(features)
        .filter(([_, enabled]) => !enabled)
        .map(([name]) => name);

    return (
        <div className="beta-status-page">
            <div className="beta-status-header">
                <h1>🚀 Beta Status Dashboard</h1>
                <p>Welcome to the MANGU Publishing Internal Beta</p>
            </div>

            {/* System Status */}
            <section className="beta-status-section">
                <h2>System Status</h2>
                <div className="status-grid">
                    <div className="status-card">
                        <div className="status-label">Environment</div>
                        <div className={`status-value env-${environment}`}>
                            {environment || 'unknown'}
                        </div>
                    </div>
                    <div className="status-card">
                        <div className="status-label">Version</div>
                        <div className="status-value">{version || 'N/A'}</div>
                    </div>
                    <div className="status-card">
                        <div className="status-label">Beta Mode</div>
                        <div className={`status-value ${beta?.enabled ? 'status-active' : 'status-inactive'}`}>
                            {beta?.enabled ? '✓ Active' : '✗ Inactive'}
                        </div>
                    </div>
                    <div className="status-card">
                        <div className="status-label">Overall Health</div>
                        <div className={`status-value status-${healthStatus?.status || 'unknown'}`}>
                            {healthStatus?.status || 'Checking...'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Health */}
            {healthStatus && (
                <section className="beta-status-section">
                    <h2>Service Health</h2>
                    <div className="service-list">
                        {Object.entries(healthStatus.services || {}).map(([service, status]) => (
                            <div key={service} className="service-item">
                                <span className="service-name">{service}</span>
                                <span className={`service-status status-${status}`}>
                                    {status === 'healthy' ? '✓' : '✗'} {status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Enabled Features */}
            <section className="beta-status-section">
                <h2>Enabled Features ({enabledFeatures.length})</h2>
                <div className="feature-grid">
                    {enabledFeatures.length > 0 ? (
                        enabledFeatures.map(feature => (
                            <div key={feature} className="feature-badge feature-enabled">
                                ✓ {formatFeatureName(feature)}
                            </div>
                        ))
                    ) : (
                        <p className="empty-state">No features explicitly enabled</p>
                    )}
                </div>
            </section>

            {/* Disabled Features */}
            {disabledFeatures.length > 0 && (
                <section className="beta-status-section">
                    <h2>Disabled Features ({disabledFeatures.length})</h2>
                    <div className="feature-grid">
                        {disabledFeatures.map(feature => (
                            <div key={feature} className="feature-badge feature-disabled">
                                ✗ {formatFeatureName(feature)}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Beta Information */}
            {beta?.enabled && (
                <section className="beta-status-section">
                    <h2>Beta Information</h2>
                    <div className="beta-info">
                        <p><strong>Feedback Email:</strong> {beta.feedbackEmail || 'N/A'}</p>
                        <p><strong>Banner Message:</strong> {beta.bannerMessage || 'N/A'}</p>
                    </div>
                </section>
            )}

            {/* Quick Links */}
            <section className="beta-status-section">
                <h2>Resources</h2>
                <div className="resource-grid">
                    <a href="https://github.com/redinc23/mangu_publishing-site/blob/main/docs/INTERNAL_BETA_GUIDE.md" 
                       className="resource-card" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        <h3>📖 Beta Guide</h3>
                        <p>Setup instructions and testing checklist</p>
                    </a>
                    <a href="https://github.com/redinc23/mangu_publishing-site/blob/main/docs/TROUBLESHOOTING.md" 
                       className="resource-card"
                       target="_blank" 
                       rel="noopener noreferrer">
                        <h3>🔧 Troubleshooting</h3>
                        <p>Common issues and solutions</p>
                    </a>
                    <a href="https://github.com/redinc23/mangu_publishing-site/blob/main/docs/KNOWN_ISSUES.md" 
                       className="resource-card"
                       target="_blank" 
                       rel="noopener noreferrer">
                        <h3>🐛 Known Issues</h3>
                        <p>Current bugs and limitations</p>
                    </a>
                    <a href="https://github.com/redinc23/mangu_publishing-site/issues" 
                       className="resource-card"
                       target="_blank" 
                       rel="noopener noreferrer">
                        <h3>💬 Report Issue</h3>
                        <p>Submit bugs and feedback</p>
                    </a>
                </div>
            </section>

            {/* System Info */}
            <section className="beta-status-section system-info">
                <details>
                    <summary>System Information</summary>
                    <pre>{JSON.stringify({
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language,
                        onLine: navigator.onLine,
                        cookieEnabled: navigator.cookieEnabled,
                        screenResolution: `${window.screen.width}x${window.screen.height}`,
                        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    }, null, 2)}</pre>
                </details>
            </section>
        </div>
    );
}

/**
 * Format feature name for display
 * @param {string} name - camelCase feature name
 * @returns {string} Human-readable name
 */
function formatFeatureName(name) {
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}
