import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Fetch initial cart contents when the provider mounts
  useEffect(() => {
    const controller = new AbortController();
    fetch('http://localhost:5000/api/cart', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCartItems(data);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load cart', err);
        }
      });

    return () => controller.abort();
  }, []);

  // Add a book to cart (by book ID)
  const addToCart = (bookId) => {
    fetch('http://localhost:5000/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId })
    })
      .then(res => res.json())
      .then(updatedCart => {
        setCartItems(updatedCart);
      })
      .catch(err => console.error('Add to cart failed', err));
  };

  // Remove a book from the cart
  const removeFromCart = (bookId) => {
    fetch('http://localhost:5000/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId })
    })
      .then(res => res.json())
      .then(updatedCart => {
        if (Array.isArray(updatedCart)) {
          setCartItems(updatedCart);
        }
      })
      .catch(err => console.error('Remove from cart failed', err));
  };

  // Clear all items from the cart
  const clearCart = () => {
    fetch('http://localhost:5000/api/cart/clear', {
      method: 'POST'
    })
      .then(res => res.json())
      .then(updatedCart => {
        if (Array.isArray(updatedCart)) {
          setCartItems(updatedCart);
        }
      })
      .catch(err => console.error('Clear cart failed', err));
  };

  // Optionally, we could implement removeFromCart if needed in the future

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
