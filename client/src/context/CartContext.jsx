import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Fetch initial cart contents when the provider mounts
  useEffect(() => {
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCartItems(data);
        }
      })
      .catch(err => console.error('Failed to load cart', err));
  }, []);

  // Add a book to cart (by book ID)
  const addToCart = (bookId) => {
    fetch('/api/cart/add', {
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

  // Optionally, we could implement removeFromCart if needed in the future

  const value = {
    cartItems,
    addToCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
