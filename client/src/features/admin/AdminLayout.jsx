import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <h2>MANGU Admin</h2>
        <nav className={styles.nav}>
          <Link to="/admin" className={styles.navLink}>Dashboard</Link>
          <Link to="/admin/books" className={styles.navLink}>Manage Books</Link>
          <Link to="/admin/authors" className={styles.navLink}>Manage Authors</Link>
          {/* Add more links for audio, video, etc. later */}
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <Outlet /> {/* This is where child routes (e.g., /admin/books) will render */}
      </main>
    </div>
  );
};

export default AdminLayout;