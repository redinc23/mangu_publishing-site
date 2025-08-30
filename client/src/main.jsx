import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { LibraryProvider } from './context/LibraryContext';
import './index.css';  // import global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Provide global state and routing to the entire app */}
    <BrowserRouter>
      <CartProvider>
        <LibraryProvider>
          <App />
        </LibraryProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
