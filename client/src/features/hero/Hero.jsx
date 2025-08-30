import React from 'react';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        {/* Left side: title and subtitle */}
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Just Read Love</h1>
          <p className={styles.heroSubtitle}>
            Discover unlimited stories, dive into new worlds, and let your imagination soar with our vast collection of premium books and audiobooks.
          </p>
          <a href="#featured" className={styles.heroCta}>
            <i className="fas fa-play"></i>
            Learn more
          </a>
        </div>
        {/* Right side: animated character graphic */}
        <div className={styles.heroRight}>
          <div className={styles.heroCharacter}>
            <div className={styles.characterBase}></div>
            <div className={styles.floatingBooks}>
              <div className={styles.floatingBook}></div>
              <div className={styles.floatingBook}></div>
              <div className={styles.floatingBook}></div>
              <div className={styles.floatingBook}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
