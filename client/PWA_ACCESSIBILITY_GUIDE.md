# PWA & Accessibility Implementation Guide

## 🚀 Progressive Web App (PWA) Features

### Overview
MANGU Publishing now includes full PWA capabilities, allowing users to install the app and use it offline.

### Files Added

#### 1. Service Worker (`public/sw.js`)
- **Caching strategies**: Network-first for API, cache-first for images and static assets
- **Offline support**: Automatic fallback to offline page
- **Background sync**: Queues failed requests for retry when online
- **Push notifications**: Infrastructure ready (requires VAPID keys)
- **Update management**: Automatic cache cleanup and version management

#### 2. Web App Manifest (`public/manifest.json`)
- App metadata and branding
- Icon specifications (72x72 to 512x512)
- Display mode: standalone
- Theme colors and orientation
- Shortcuts for quick actions
- Share target for web share API

#### 3. Offline Page (`public/offline.html`)
- Standalone fallback page when offline
- Auto-detects connection restoration
- Accessible and responsive design

#### 4. Service Worker Registration (`src/lib/serviceWorkerRegistration.js`)
- Automatic registration in production
- Update notifications
- Error handling
- Background sync utilities
- Push notification subscription helpers

### Usage

#### In Your App
```jsx
import { register } from './lib/serviceWorkerRegistration';

// Register service worker
register({
  onSuccess: (registration) => {
    console.log('SW registered successfully');
  },
  onUpdate: (registration) => {
    // Show update prompt
  }
});
```

#### Install Prompt Component
```jsx
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      <PWAInstallPrompt />
      {/* Your app content */}
    </>
  );
}
```

#### Update Notification
```jsx
import { PWAUpdateNotification } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      <PWAUpdateNotification />
      {/* Your app content */}
    </>
  );
}
```

#### Offline Indicator
```jsx
import { OfflineIndicator } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      <OfflineIndicator />
      {/* Your app content */}
    </>
  );
}
```

### Icon Requirements
Generate PWA icons using tools like:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/imageGenerator)

Required sizes in `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Push Notifications Setup
1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add to `.env`:
```env
VITE_VAPID_PUBLIC_KEY=your_public_key
```

3. Subscribe users:
```jsx
import { subscribeToPushNotifications } from './lib/serviceWorkerRegistration';

const subscription = await subscribeToPushNotifications();
// Send subscription to your backend
```

### Testing PWA Features

#### Development
```bash
npm run build
npm run preview
```
Then visit `chrome://inspect/#service-workers`

#### Production Checklist
- [ ] HTTPS enabled
- [ ] manifest.json served with correct MIME type
- [ ] Icons generated and placed in `/public/icons/`
- [ ] Service worker registered
- [ ] Offline page accessible
- [ ] Install prompt appears on supported browsers
- [ ] App installs correctly
- [ ] Updates work as expected

---

## ♿ Accessibility (WCAG 2.1 AA) Implementation

### Overview
Comprehensive accessibility features ensure MANGU Publishing is usable by everyone, including users with disabilities.

### Files Added

#### 1. Accessibility Utilities (`src/lib/a11y.js`)
- Screen reader announcements
- Focus management
- Keyboard navigation helpers
- Color contrast checker
- ARIA helpers
- Skip link utilities
- Motion preference detection

#### 2. Accessibility Hooks (`src/hooks/useA11y.js`)
- `useAnnouncer()`: Screen reader announcements
- `useFocusTrap()`: Modal focus management
- `useFocusRestore()`: Restore focus after dialogs
- `useKeyboardNav()`: Keyboard event handling
- `useAriaAttributes()`: Dynamic ARIA attributes
- `useAccessibleClick()`: Keyboard-friendly clicks
- `useSkipLink()`: Skip navigation links
- `useReducedMotion()`: Motion preferences
- `usePageTitle()`: Accessible page titles
- `useRovingTabIndex()`: Keyboard list navigation

#### 3. Accessible Components (`src/components/A11yComponents.jsx`)
- `AccessibleButton`: Keyboard-friendly button
- `VisuallyHidden`: Screen reader only content
- `SkipLink`: Skip to main content
- `LiveRegion`: Dynamic announcements
- `AccessibleCard`: Interactive cards
- `FormField`: Accessible form fields
- `LoadingSpinner`: Loading states
- `Breadcrumb`: Navigation breadcrumbs

### Usage Examples

#### Screen Reader Announcements
```jsx
import { useAnnouncer } from '../hooks/useA11y';

function MyComponent() {
  const { announce, assertive } = useAnnouncer();
  
  const handleAction = () => {
    // Polite announcement (non-interrupting)
    announce('Item added to cart');
    
    // Assertive announcement (interrupts)
    assertive('Error: Payment failed');
  };
}
```

#### Focus Management
```jsx
import { useFocusTrap, useFocusRestore } from '../hooks/useA11y';

function Modal({ isOpen, onClose }) {
  const modalRef = useFocusTrap(isOpen);
  useFocusRestore(); // Restores focus on unmount
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

#### Keyboard Navigation
```jsx
import { useKeyboardNav } from '../hooks/useA11y';

function Dropdown() {
  const keyboardProps = useKeyboardNav({
    Escape: () => closeDropdown(),
    ArrowDown: () => moveDown(),
    ArrowUp: () => moveUp(),
    Enter: () => selectItem()
  });
  
  return <div {...keyboardProps}>{/* content */}</div>;
}
```

#### Accessible Forms
```jsx
import { FormField } from '../components/A11yComponents';

function MyForm() {
  return (
    <form>
      <FormField
        label="Email"
        error={errors.email}
        hint="We'll never share your email"
        required
      >
        <input type="email" />
      </FormField>
    </form>
  );
}
```

#### Page Titles
```jsx
import { usePageTitle } from '../hooks/useA11y';

function BookPage({ book }) {
  usePageTitle(book.title); // Announces page changes
  
  return <div>{/* content */}</div>;
}
```

#### Reduced Motion
```jsx
import { useReducedMotion } from '../hooks/useA11y';
import { motion } from 'framer-motion';

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.2 }}
      transition={prefersReducedMotion ? { duration: 0 } : {}}
    >
      {/* content */}
    </motion.div>
  );
}
```

### CSS Accessibility Features

The following are automatically included in `index.css`:

#### Focus Visible
- Keyboard navigation shows focus rings
- Mouse clicks don't show focus rings
- Customizable focus styles

#### Skip Links
- "Skip to main content" appears on Tab
- Styled for visibility when focused
- Improves keyboard navigation

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
}
```

#### High Contrast Mode
```css
@media (prefers-contrast: high) {
  /* Enhanced borders and contrast */
}
```

### Accessibility Checklist

#### Semantic HTML
- [ ] Use semantic elements (`<nav>`, `<main>`, `<article>`, etc.)
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmark regions (`role="banner"`, `role="main"`, etc.)

#### Keyboard Navigation
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators
- [ ] Logical tab order
- [ ] Keyboard shortcuts for common actions
- [ ] Escape key closes modals/dropdowns

#### Screen Readers
- [ ] Images have alt text
- [ ] Links have descriptive text
- [ ] Forms have labels
- [ ] Dynamic content announced
- [ ] Status messages use live regions

#### Color & Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text)
- [ ] Don't rely on color alone for meaning
- [ ] Test with color blindness simulators

#### Forms
- [ ] Labels associated with inputs
- [ ] Required fields marked
- [ ] Error messages descriptive
- [ ] Focus on first error
- [ ] Success messages announced

#### Media
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Auto-play can be paused
- [ ] Media controls are accessible

#### Responsive
- [ ] Zoom to 200% without breaking
- [ ] Touch targets ≥ 44×44 pixels
- [ ] Text reflows on narrow screens
- [ ] No horizontal scrolling (except intentional)

### Testing Tools

#### Automated Testing
```bash
# Install axe-core
npm install --save-dev @axe-core/react

# In your test setup
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Test component
const { container } = render(<MyComponent />);
const results = await axe(container);
expect(results).toHaveNoViolations();
```

#### Browser Extensions
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (built into Chrome)

#### Screen Readers
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **Linux**: Orca

#### Manual Testing
1. Navigate using only keyboard (Tab, Shift+Tab, Enter, Space, Arrows)
2. Test with screen reader
3. Zoom to 200% in browser
4. Enable high contrast mode
5. Enable reduced motion preference
6. Test with color blindness simulator

### Best Practices

#### Do's ✅
- Use semantic HTML
- Provide text alternatives
- Ensure keyboard access
- Support screen readers
- Test with real users
- Follow WCAG 2.1 AA guidelines
- Announce dynamic changes
- Maintain focus management
- Support user preferences (motion, contrast)

#### Don'ts ❌
- Don't use `tabindex` > 0
- Don't remove focus indicators
- Don't auto-play media without controls
- Don't rely on color alone
- Don't use divs/spans for buttons/links
- Don't forget alt text
- Don't break keyboard navigation
- Don't ignore screen reader testing

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)
- [Inclusive Components](https://inclusive-components.design/)

---

## 🔄 Integration with Existing Code

### App.jsx
Add PWA components to your main App component:

```jsx
import { PWAInstallPrompt, PWAUpdateNotification, OfflineIndicator } from './components/PWAInstallPrompt';
import { SkipLink } from './components/A11yComponents';

function App() {
  return (
    <>
      <SkipLink targetId="main-content" />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <OfflineIndicator />
      
      <YourHeader />
      
      <main id="main-content" role="main">
        <YourContent />
      </main>
      
      <YourFooter />
    </>
  );
}
```

### Environment Variables
Add to `.env`:
```env
# PWA Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# Analytics (optional)
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## 📊 Monitoring & Analytics

### Service Worker Events
Monitor SW lifecycle events in your analytics:

```javascript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Log SW update
  analytics.track('service_worker_updated');
});

window.addEventListener('online', () => {
  analytics.track('connection_restored');
});

window.addEventListener('offline', () => {
  analytics.track('went_offline');
});
```

### Accessibility Metrics
Track accessibility-related user behavior:

```javascript
// Track reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  analytics.track('prefers_reduced_motion');
}

// Track keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    analytics.track('keyboard_navigation');
  }
});
```

---

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Verify PWA
1. Deploy to HTTPS domain
2. Visit [Google's PWA Tester](https://www.pwabuilder.com/)
3. Run Lighthouse audit
4. Test on real devices

### CDN Configuration
Ensure proper cache headers for service worker:

```nginx
# Don't cache service worker
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# Cache manifest with short TTL
location /manifest.json {
    add_header Cache-Control "public, max-age=3600";
}
```

---

## 📝 Maintenance

### Updating Service Worker
1. Increment `CACHE_NAME` in `sw.js`
2. Update `PRECACHE_URLS` if needed
3. Test locally with production build
4. Deploy and monitor update adoption

### Accessibility Audits
Run regular audits:
```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://your-app.com --view

# axe-core
npm run test:a11y
```

---

## 🆘 Troubleshooting

### Service Worker Not Registering
- Check HTTPS (required for SW)
- Verify `sw.js` is accessible
- Check browser console for errors
- Clear browser cache and reload

### Install Prompt Not Showing
- Manifest must be valid
- Site must be HTTPS
- User must visit at least twice
- Check Chrome's install criteria

### Accessibility Issues
- Run automated tests (axe, Lighthouse)
- Test with keyboard only
- Test with screen reader
- Review ARIA attributes
- Check color contrast

---

## 📚 Further Reading

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
