import React from 'react';
import Hero from '../hero/Hero';
import FeaturedBook from '../featuredBook/FeaturedBook';
import TrendingSection from '../trending/TrendingSection';
import TopRatedRow from '../topRated/TopRatedRow'; // Corrected import name
import BookRow from '../bookRow/BookRow';
import AuthorRow from '../authorRow/AuthorRow';
import GenresSection from '../genres/GenresSection';
import ContinueReadingSection from '../continueReading/ContinueReadingSection';

const HomePage = () => {
  return (
    <div>
      <Hero />
      <FeaturedBook />
      <TrendingSection />
      <TopRatedRow /> {/* Corrected component name */}
      <BookRow />
      <AuthorRow />
      <GenresSection />
      <ContinueReadingSection />
    </div>
  );
};

export default HomePage;
