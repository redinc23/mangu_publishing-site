import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../lib/analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    const pageName = location.pathname;
    analytics.trackPageView(pageName, {
      search: location.search,
      hash: location.hash
    });
  }, [location]);
};

export default usePageTracking;
