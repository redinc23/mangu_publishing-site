import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and use feature flags
 * @returns {Object} { features, beta, isLoading, error }
 */
export function useFeatureFlags() {
    const [config, setConfig] = useState({
        features: {},
        beta: null,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        async function fetchConfig() {
            try {
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error('Failed to fetch configuration');
                }
                
                const data = await response.json();
                
                if (!cancelled) {
                    setConfig({
                        features: data.features || {},
                        beta: data.beta,
                        environment: data.environment,
                        version: data.version,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Failed to load feature flags:', error);
                if (!cancelled) {
                    setConfig(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error.message,
                    }));
                }
            }
        }

        fetchConfig();

        return () => {
            cancelled = true;
        };
    }, []);

    return config;
}

/**
 * Custom hook to check if a specific feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} Whether the feature is enabled
 */
export function useFeature(featureName) {
    const { features, isLoading } = useFeatureFlags();
    
    if (isLoading) {
        return false; // Default to disabled while loading
    }
    
    return features[featureName] === true;
}

/**
 * Custom hook to check if we're in beta mode
 * @returns {boolean} Whether beta mode is enabled
 */
export function useBetaMode() {
    const { beta, isLoading } = useFeatureFlags();
    
    if (isLoading) {
        return false;
    }
    
    return beta !== null && beta.enabled === true;
}

export default {
    useFeatureFlags,
    useFeature,
    useBetaMode,
};
