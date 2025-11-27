import { useEffect, useRef, useCallback, useState } from 'react';
import { announcer, focusManagement, keyboard } from '../lib/a11y';

/**
 * Hook for screen reader announcements
 */
export function useAnnouncer() {
  const announce = useCallback((message, priority = 'polite') => {
    announcer.announce(message, priority);
  }, []);

  const assertive = useCallback((message) => {
    announcer.assertive(message);
  }, []);

  return { announce, assertive };
}

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(isActive = true) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const cleanup = focusManagement.trapFocus(elementRef.current);
    return cleanup;
  }, [isActive]);

  return elementRef;
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = focusManagement.saveFocus();
    
    return () => {
      if (previousFocus.current) {
        focusManagement.restoreFocus(previousFocus.current);
      }
    };
  }, []);
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNav(handlers = {}) {
  const handleKeyDown = useCallback((event) => {
    const { key } = event;

    if (handlers[key]) {
      event.preventDefault();
      handlers[key](event);
    } else if (keyboard.isNavigationKey(key) && handlers.navigation) {
      handlers.navigation(event, key);
    } else if (keyboard.isActionKey(key) && handlers.action) {
      event.preventDefault();
      handlers.action(event);
    }
  }, [handlers]);

  return { onKeyDown: handleKeyDown };
}

/**
 * Hook for managing ARIA attributes
 */
export function useAriaAttributes(elementRef, attributes = {}) {
  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value.toString());
      } else {
        element.removeAttribute(key);
      }
    });
  }, [elementRef, attributes]);
}

/**
 * Hook for accessible click handlers (supports keyboard)
 */
export function useAccessibleClick(onClick, { enterKey = true, spaceKey = true } = {}) {
  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    
    if ((enterKey && key === keyboard.KEYS.ENTER) || 
        (spaceKey && key === keyboard.KEYS.SPACE)) {
      event.preventDefault();
      onClick(event);
    }
  }, [onClick, enterKey, spaceKey]);

  return {
    onClick,
    onKeyDown: handleKeyDown,
    role: 'button',
    tabIndex: 0
  };
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink(targetId) {
  useEffect(() => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    const handleFocus = () => {
      skipLink.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: auto;
        height: auto;
        overflow: visible;
        background: #667eea;
        color: white;
        padding: 0.75rem 1rem;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 100;
      `;
    };

    const handleBlur = () => {
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
    };

    skipLink.addEventListener('focus', handleFocus);
    skipLink.addEventListener('blur', handleBlur);
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      skipLink.removeEventListener('focus', handleFocus);
      skipLink.removeEventListener('blur', handleBlur);
      skipLink.remove();
    };
  }, [targetId]);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for page title management
 */
export function usePageTitle(title, announceChange = true) {
  const { announce: announceToSR } = useAnnouncer();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | MANGU Publishing` : 'MANGU Publishing';
    
    if (announceChange) {
      announceToSR(`Navigated to ${title || 'Home'}`);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, announceChange, announceToSR]);
}

/**
 * Hook for live region updates
 */
export function useLiveRegion(ref, text, priority = 'polite') {
  useEffect(() => {
    if (!ref.current || !text) return;

    ref.current.setAttribute('role', 'status');
    ref.current.setAttribute('aria-live', priority);
    ref.current.setAttribute('aria-atomic', 'true');
    ref.current.textContent = text;
  }, [ref, text, priority]);
}

/**
 * Hook for managing roving tabindex
 */
export function useRovingTabIndex(items, orientation = 'horizontal') {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback((event) => {
    const { key } = event;
    let newIndex = activeIndex;

    if (orientation === 'horizontal') {
      if (key === keyboard.KEYS.ARROW_LEFT) {
        newIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
      } else if (key === keyboard.KEYS.ARROW_RIGHT) {
        newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      }
    } else {
      if (key === keyboard.KEYS.ARROW_UP) {
        newIndex = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
      } else if (key === keyboard.KEYS.ARROW_DOWN) {
        newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      }
    }

    if (key === keyboard.KEYS.HOME) {
      newIndex = 0;
    } else if (key === keyboard.KEYS.END) {
      newIndex = items.length - 1;
    }

    if (newIndex !== activeIndex) {
      event.preventDefault();
      setActiveIndex(newIndex);
      items[newIndex]?.focus();
    }
  }, [activeIndex, items, orientation]);

  return { activeIndex, setActiveIndex, handleKeyDown };
}
