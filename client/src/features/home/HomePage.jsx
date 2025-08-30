import React from 'react';
import Hero from '../hero/Hero';
import FeaturedBook from '../featuredBook/FeaturedBook';
import TrendingSection from '../trending/TrendingSection';
import BookRow from '../bookRow/BookRow';
import AuthorRow from '../authorRow/AuthorRow';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <FeaturedBook />
      <TrendingSection />
      <BookRow />
      <AuthorRow />
    </div>
  );
};

export default HomePage;
