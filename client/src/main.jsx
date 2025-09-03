// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LibraryProvider } from './context/LibraryContext';

// IMPORTANT: call configureAmplify() BEFORE rendering anything
import { configureAmplify } from './config/aws';

import './index.css';

// initialize Amplify (Cognito, OAuth, etc.)
configureAmplify();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <LibraryProvider>
            <App />
          </LibraryProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
