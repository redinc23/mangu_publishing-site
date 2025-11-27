/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// Screen reader announcements
export class A11yAnnouncer {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    if (typeof document === 'undefined') return;

    // Create live region for announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);
  }

  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';
    
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
  }

  assertive(message) {
    this.announce(message, 'assertive');
  }
}

// Singleton instance
export const announcer = new A11yAnnouncer();

// Focus management
export const focusManagement = {
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  saveFocus() {
    return document.activeElement;
  },

  restoreFocus(element) {
    if (element && element.focus) {
      element.focus();
    }
  },

  focusFirstError(formElement) {
    const errorElement = formElement.querySelector('[aria-invalid="true"]');
    if (errorElement) {
      errorElement.focus();
      this.scrollIntoView(errorElement);
    }
  },

  scrollIntoView(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    };
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      defaultOptions.behavior = 'auto';
    }

    element.scrollIntoView({ ...defaultOptions, ...options });
  }
};

// Keyboard navigation helpers
export const keyboard = {
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End'
  },

  isNavigationKey(key) {
    return [
      this.KEYS.ARROW_UP,
      this.KEYS.ARROW_DOWN,
      this.KEYS.ARROW_LEFT,
      this.KEYS.ARROW_RIGHT,
      this.KEYS.HOME,
      this.KEYS.END
    ].includes(key);
  },

  isActionKey(key) {
    return [this.KEYS.ENTER, this.KEYS.SPACE].includes(key);
  }
};

// Color contrast checker
export const colorContrast = {
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  getContrastRatio(rgb1, rgb2) {
    const lum1 = this.getLuminance(...rgb1);
    const lum2 = this.getLuminance(...rgb2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  meetsWCAG_AA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  meetsWCAG_AAA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
};

// ARIA helpers
export const aria = {
  setExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded.toString());
  },

  setPressed(element, pressed) {
    element.setAttribute('aria-pressed', pressed.toString());
  },

  setSelected(element, selected) {
    element.setAttribute('aria-selected', selected.toString());
  },

  setCurrent(element, current = 'page') {
    element.setAttribute('aria-current', current);
  },

  setInvalid(element, invalid, errorMessage) {
    element.setAttribute('aria-invalid', invalid.toString());
    if (invalid && errorMessage) {
      const errorId = `${element.id || 'field'}-error`;
      element.setAttribute('aria-describedby', errorId);
    } else {
      element.removeAttribute('aria-describedby');
    }
  },

  setDisabled(element, disabled) {
    element.setAttribute('aria-disabled', disabled.toString());
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  },

  setBusy(element, busy) {
    element.setAttribute('aria-busy', busy.toString());
  },

  hide(element) {
    element.setAttribute('aria-hidden', 'true');
  },

  show(element) {
    element.removeAttribute('aria-hidden');
  }
};

// Skip links utility
export function createSkipLink(targetId, label = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    background: #667eea;
    color: white;
    padding: 0.75rem 1rem;
    text-decoration: none;
    border-radius: 0 0 4px 0;
    z-index: 100;
  `;

  skipLink.addEventListener('focus', () => {
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
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
  });

  return skipLink;
}

// Reduced motion preference
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Focus visible polyfill
export function setupFocusVisible() {
  let hadKeyboardEvent = true;
  let hadFocusVisibleRecently = false;
  let hadFocusVisibleRecentlyTimeout = null;

  const inputTypesAllowlist = {
    text: true,
    search: true,
    url: true,
    tel: true,
    email: true,
    password: true,
    number: true,
    date: true,
    month: true,
    week: true,
    time: true,
    datetime: true,
    'datetime-local': true
  };

  function onKeyDown(e) {
    if (e.metaKey || e.altKey || e.ctrlKey) {
      return;
    }
    hadKeyboardEvent = true;
  }

  function onPointerDown() {
    hadKeyboardEvent = false;
  }

  function onFocus(e) {
    if (!hadKeyboardEvent && !isTextInput(e.target)) {
      return;
    }
    e.target.classList.add('focus-visible');
  }

  function onBlur(e) {
    e.target.classList.remove('focus-visible');
  }

  function isTextInput(el) {
    return el.tagName === 'TEXTAREA' || 
           (el.tagName === 'INPUT' && inputTypesAllowlist[el.type]);
  }

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('touchstart', onPointerDown, true);
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);
}
