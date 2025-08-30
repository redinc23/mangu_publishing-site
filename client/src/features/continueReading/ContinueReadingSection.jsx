import React from 'react';
import styles from './ContinueReadingSection.module.css';

const ContinueReadingSection = () => {
  return (
    <section className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Continue Reading</h2>
      </div>
      <p className={styles.placeholder}>
        Log in to see your progress.
      </p>
    </section>
  );
};

export default ContinueReadingSection;