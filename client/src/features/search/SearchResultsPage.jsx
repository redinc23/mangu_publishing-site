import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SearchResultsPage = () => {
  const [results, setResults] = useState([]);
  const location = useLocation();

  // Extract query param (if any)
  const query = new URLSearchParams(location.search).get('query');

  useEffect(() => {
    if (query) {
      // In a real app, you'd call a search API endpoint
      console.log(`Searching for "${query}"...`);
      // For now, we can simulate by filtering the available books if needed
      setResults([]); 
    }
  }, [query]);

  return (
    <main style={{ padding: '80px 20px' }}>
      <h1>Search Results</h1>
      {query ? <p>Results for "<strong>{query}</strong>":</p> : <p>Please enter a search query.</p>}
      {results.length === 0 ? (
        query ? <p>No results found.</p> : null
      ) : (
        <ul>
          {results.map(item => (
            <li key={item.id}>{item.title} by {item.author}</li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default SearchResultsPage;
