import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;
const isDevelopment = import.meta.env.DEV;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: isDevelopment,
    track_pageview: false, // We'll track manually
    persistence: 'localStorage'
  });
} else if (!isDevelopment) {
  console.warn('Mixpanel token not configured');
}

// Analytics wrapper
export const analytics = {
  // Track an event
  track: (eventName, properties = {}) => {
    if (!MIXPANEL_TOKEN) {
      if (isDevelopment) {
        console.log('[Analytics]', eventName, properties);
      }
      return;
    }
    mixpanel.track(eventName, properties);
  },

  // Identify a user
  identify: (userId) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.identify(userId);
  },

  // Set user properties
  setUserProperties: (properties) => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.people.set(properties);
  },

  // Track page view
  trackPageView: (pageName, properties = {}) => {
    if (!MIXPANEL_TOKEN) {
      if (isDevelopment) {
        console.log('[Analytics] Page View:', pageName, properties);
      }
      return;
    }
    mixpanel.track('Page View', {
      page: pageName,
      ...properties
    });
  },

  // User Sign Up
  trackSignUp: (method = 'email') => {
    analytics.track('User Sign Up', { method });
  },

  // User Sign In
  trackSignIn: (method = 'email') => {
    analytics.track('User Sign In', { method });
  },

  // Add to Cart
  trackAddToCart: (bookId, bookTitle, price) => {
    analytics.track('Add to Cart', {
      book_id: bookId,
      book_title: bookTitle,
      price
    });
  },

  // Purchase Completed
  trackPurchaseCompleted: (orderId, items, total) => {
    analytics.track('Purchase Completed', {
      order_id: orderId,
      items_count: items.length,
      total_amount: total,
      items
    });
  },

  // Reset (on logout)
  reset: () => {
    if (!MIXPANEL_TOKEN) return;
    mixpanel.reset();
  }
};

export default analytics;
