export const featuredBook = {
  id: 1,
  title: "The Midnight Library",
  author: "Matt Haig",
  genre: "Fiction",
  year: 2024,
  cover: "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&w=600&h=900&fit=crop",
  rating: null,
  description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be different if you had made different choices..."
};

export const trendingBooks = [
  {
    id: 2,
    title: "The Lost City",
    author: "John Doe",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&w=400&h=300&fit=crop",
    rating: 4.3,
    description: null
  },
  {
    id: 3,
    title: "Midnight",
    author: "Jane Smith",
    cover: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&w=400&h=300&fit=crop",
    rating: 4.1,
    description: null
  },
  {
    id: 4,
    title: "Final Hour",
    author: "Alice Johnson",
    cover: "https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?ixlib=rb-4.0.3&w=400&h=300&fit=crop",
    rating: 4.5,
    description: null
  },
  {
    id: 5,
    title: "Ashes Time",
    author: "Bob Brown",
    cover: "https://images.unsplash.com/photo-1531913764164-f85c52e6e654?ixlib=rb-4.0.3&w=400&h=300&fit=crop",
    rating: 4.2,
    description: null
  },
  {
    id: 6,
    title: "Beneath Deep",
    author: "Carol Black",
    cover: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&w=400&h=300&fit=crop",
    rating: 4.4,
    description: null
  }
];

export const newReleases = [
  {
    id: 7,
    title: "Chasing the Stars",
    author: "Alex Chen",
    cover: "https://images.unsplash.com/photo-1531913764164-f85c52e6e654?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.8,
    description: null
  },
  {
    id: 8,
    title: "The Silent Code",
    author: "Maria Rodriguez",
    cover: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.6,
    description: null
  },
  {
    id: 9,
    title: "Veil of Secrets",
    author: "James Wilson",
    cover: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.9,
    description: null
  },
  {
    id: 10,
    title: "Shadow's Edge",
    author: "Emma Roberts",
    cover: "https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.7,
    description: null
  },
  {
    id: 11,
    title: "Beyond Tomorrow",
    author: "David Kim",
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.5,
    description: null
  },
  {
    id: 12,
    title: "Quantum Dreams",
    author: "Lisa Park",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&w=400&h=600&fit=crop",
    rating: 4.8,
    description: null
  }
];

// Aggregate list of all books for easy lookup by ID
export const books = [ featuredBook, ...trendingBooks, ...newReleases ];
