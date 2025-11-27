import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getBookById } from '../data/mockBooks';
import { apiClient } from '../lib/api';

const STORAGE_KEY = 'mangu-cart';

const isBrowser = typeof window !== 'undefined';

const safelyParseCart = (rawValue) => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item?.bookId === 'string')
        .map((item) => ({
          bookId: item.bookId,
          quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
          // Store book data if available (from API)
          bookData: item.bookData || null
        }));
    }
    return [];
  } catch (error) {
    console.warn('[cart] Failed to parse stored cart, resetting.', error);
    return [];
  }
};

const loadInitialCart = () => {
  if (!isBrowser) return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return safelyParseCart(stored);
};

const mapEntriesToBooks = (entries) => {
  return entries
    .map((entry) => {
      // If we have stored book data, use it (preferred - works for API books)
      if (entry.bookData) {
        return {
          ...entry.bookData,
          quantity: entry.quantity
        };
      }
      
      // Fallback to mock data for backward compatibility
      const mockBook = getBookById(entry.bookId);
      if (mockBook) {
        return {
          ...mockBook,
          quantity: entry.quantity
        };
      }
      
      // If no book data available, return a minimal book object
      return {
        id: entry.bookId,
        title: 'Book',
        price_cents: 0,
        quantity: entry.quantity
      };
    })
    .filter(Boolean);
};

export const CartContext = createContext({
  cartItems: [],
  cartCount: 0,
  cartSubtotal: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {}
});

export const CartProvider = ({ children }) => {
  const [entries, setEntries] = useState(loadInitialCart);

  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const cartItems = useMemo(() => mapEntriesToBooks(entries), [entries]);
  const cartCount = useMemo(
    () => entries.reduce((sum, item) => sum + item.quantity, 0),
    [entries]
  );
  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, book) => sum + ((book.price_cents || 0) * (book.quantity || 1)),
        0
      ),
    [cartItems]
  );

  const addToCart = useCallback((bookId, bookData = null) => {
    if (!bookId) return;
    setEntries((prev) => {
      const existing = prev.find((item) => item.bookId === bookId);
      if (existing) {
        return prev.map((item) =>
          item.bookId === bookId
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                bookData: bookData || item.bookData
              }
            : item
        );
      }
      return [...prev, { 
        bookId, 
        quantity: 1,
        bookData: bookData || null
      }];
    });
  }, []);

  const removeFromCart = useCallback((bookId) => {
    setEntries((prev) => prev.filter((item) => item.bookId !== bookId));
  }, []);

  const updateQuantity = useCallback((bookId, nextQuantity) => {
    if (!bookId) return;
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);
    setEntries((prev) =>
      prev.map((item) =>
        item.bookId === bookId ? { ...item, quantity: safeQuantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setEntries([]);
  }, []);

  const value = {
    cartItems,
    cartCount,
    cartSubtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
