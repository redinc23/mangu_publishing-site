/**
 * Feature Flags Configuration
 * 
 * This module provides a centralized way to manage feature flags
 * for beta testing and gradual feature rollout.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Feature flag definitions
 * Each flag can be controlled via environment variables
 */
export const featureFlags = {
    // Core features
    audiobooks: process.env.FEATURE_AUDIOBOOKS === 'true',
    socialSharing: process.env.FEATURE_SOCIAL_SHARING === 'true',
    bookClubs: process.env.FEATURE_BOOK_CLUBS === 'true',
    readingChallenges: process.env.FEATURE_READING_CHALLENGES === 'true',
    
    // Admin features
    adminPanel: process.env.FEATURE_ADMIN_PANEL === 'true',
    userManagement: process.env.FEATURE_USER_MANAGEMENT === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true',
    
    // Beta-specific features
    betaFeedback: process.env.FEATURE_BETA_FEEDBACK !== 'false', // Enabled by default in beta
    debugPanel: process.env.FEATURE_DEBUG_PANEL === 'true',
    mockData: process.env.FEATURE_MOCK_DATA === 'true',
    
    // Experimental features
    aiRecommendations: process.env.FEATURE_AI_RECOMMENDATIONS === 'true',
    voiceSearch: process.env.FEATURE_VOICE_SEARCH === 'true',
    offlineMode: process.env.FEATURE_OFFLINE_MODE === 'true',
    
    // Payment and commerce
    stripePayments: process.env.FEATURE_STRIPE_PAYMENTS === 'true',
    giftCards: process.env.FEATURE_GIFT_CARDS === 'true',
    subscriptions: process.env.FEATURE_SUBSCRIPTIONS === 'true',
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(featureName) {
    return featureFlags[featureName] === true;
}

/**
 * Get all enabled features
 * @returns {string[]} List of enabled feature names
 */
export function getEnabledFeatures() {
    return Object.keys(featureFlags).filter(key => featureFlags[key] === true);
}

/**
 * Get feature flags as JSON (for API endpoints)
 * @returns {Object} Feature flags object
 */
export function getFeatureFlagsJSON() {
    return { ...featureFlags };
}

/**
 * Check if we're in beta mode
 * @returns {boolean}
 */
export function isBetaMode() {
    return process.env.BETA_MODE === 'true' || 
           process.env.NODE_ENV === 'beta';
}

/**
 * Get beta configuration
 * @returns {Object} Beta configuration
 */
export function getBetaConfig() {
    if (!isBetaMode()) {
        return null;
    }
    
    return {
        enabled: true,
        bannerMessage: process.env.BETA_BANNER_MESSAGE || 'You are using the BETA version of MANGU Publishing',
        feedbackEmail: process.env.BETA_FEEDBACK_EMAIL || 'beta-feedback@mangu.com',
        accessCode: process.env.BETA_TESTER_ACCESS_CODE,
        features: getEnabledFeatures(),
    };
}

export default {
    featureFlags,
    isFeatureEnabled,
    getEnabledFeatures,
    getFeatureFlagsJSON,
    isBetaMode,
    getBetaConfig,
};
