// Mock book data for development/testing
export const mockBooks = [
  {
    id: '1',
    title: 'Whispers in the Shadow',
    subtitle: 'A Tale of Mystery and Intrigue',
    authors: [{ id: 'a1', name: 'Sarah Johnson' }],
    description: 'In a world where shadows hold secrets, one detective must uncover the truth before darkness consumes everything.',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1299,
    rating: 4.8,
    rating_count: 1247,
    view_count: 15234,
    is_featured: true,
    is_new_release: false,
    publication_date: '2024-01-15',
    categories: ['Mystery', 'Thriller'],
    tags: ['mystery', 'thriller', 'detective']
  },
  {
    id: '2',
    title: 'The Resonance Engine',
    subtitle: 'Cosmic Novel Experience',
    authors: [{ id: 'a2', name: 'Marcus Chen' }],
    description: 'A groundbreaking science fiction epic that explores the boundaries of reality and consciousness.',
    cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1599,
    rating: 4.9,
    rating_count: 2156,
    view_count: 28456,
    is_featured: false,
    is_new_release: true,
    publication_date: '2024-03-20',
    categories: ['Science Fiction', 'Fantasy'],
    tags: ['sci-fi', 'cosmic', 'philosophy']
  },
  {
    id: '3',
    title: 'Echoes of Tomorrow',
    authors: [{ id: 'a3', name: 'Emily Rodriguez' }],
    description: 'A time-traveling adventure that questions the nature of destiny and free will.',
    cover_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1199,
    rating: 4.6,
    rating_count: 892,
    view_count: 12345,
    is_featured: false,
    is_new_release: false,
    publication_date: '2023-11-10',
    categories: ['Science Fiction', 'Adventure'],
    tags: ['time-travel', 'adventure', 'destiny']
  },
  {
    id: '4',
    title: 'The Last Library',
    authors: [{ id: 'a4', name: 'David Thompson' }],
    description: 'In a world where books are forbidden, one librarian holds the key to preserving knowledge.',
    cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1399,
    rating: 4.7,
    rating_count: 1567,
    view_count: 18923,
    is_featured: true,
    is_new_release: false,
    publication_date: '2023-09-05',
    categories: ['Dystopian', 'Literary Fiction'],
    tags: ['dystopian', 'books', 'knowledge']
  },
  {
    id: '5',
    title: 'Midnight Garden',
    authors: [{ id: 'a5', name: 'Luna Martinez' }],
    description: 'A magical realism story about a garden that blooms only at midnight and grants wishes.',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1099,
    rating: 4.5,
    rating_count: 743,
    view_count: 9876,
    is_featured: false,
    is_new_release: true,
    publication_date: '2024-02-14',
    categories: ['Magical Realism', 'Fantasy'],
    tags: ['magic', 'garden', 'wishes']
  },
  {
    id: '6',
    title: 'Digital Dreams',
    authors: [{ id: 'a6', name: 'Alex Kim' }],
    description: 'A cyberpunk thriller set in a near-future where virtual reality and reality blur.',
    cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&h=600&q=80',
    price_cents: 1499,
    rating: 4.8,
    rating_count: 2034,
    view_count: 25678,
    is_featured: false,
    is_new_release: false,
    publication_date: '2023-12-01',
    categories: ['Cyberpunk', 'Thriller'],
    tags: ['cyberpunk', 'virtual-reality', 'thriller']
  }
];

export const getBookById = (id) => {
  return mockBooks.find(book => book.id === id) || null;
};

export const getFeaturedBook = () => {
  return mockBooks.find(book => book.is_featured) || mockBooks[0];
};

export const getTrendingBooks = (limit = 10) => {
  return mockBooks
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, limit);
};

export const getNewReleases = (limit = 10) => {
  return mockBooks
    .filter(book => book.is_new_release)
    .slice(0, limit);
};

