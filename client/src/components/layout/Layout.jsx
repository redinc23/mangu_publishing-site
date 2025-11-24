import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BetaBanner from '../BetaBanner';

function Layout() {
  // Check if we're in beta mode
  const isBeta = import.meta.env.MODE === 'beta' || 
                 import.meta.env.VITE_BETA_MODE === 'true' ||
                 window.location.hostname.includes('beta');

  return (
    <div className="app-layout">
      {isBeta && <BetaBanner />}
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
