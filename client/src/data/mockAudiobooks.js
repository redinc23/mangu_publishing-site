// Mock audiobook data for development/testing
export const mockAudiobooks = [
  {
    id: 'audio-1',
    book_id: '1',
    title: 'Whispers in the Shadow',
    authors: [{ id: 'a1', name: 'Sarah Johnson' }],
    narrator: 'James Mitchell',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&h=600&q=80',
    duration_seconds: 28800, // 8 hours
    chapters: [
      { id: 'ch1', title: 'Chapter 1: The Beginning', duration: 1800, start_time: 0 },
      { id: 'ch2', title: 'Chapter 2: Shadows Emerge', duration: 1950, start_time: 1800 },
      { id: 'ch3', title: 'Chapter 3: The Investigation', duration: 2100, start_time: 3750 },
      { id: 'ch4', title: 'Chapter 4: Hidden Clues', duration: 1920, start_time: 5850 },
      { id: 'ch5', title: 'Chapter 5: The Revelation', duration: 2010, start_time: 7770 }
    ],
    rating: 4.8,
    rating_count: 1247
  },
  {
    id: 'audio-2',
    book_id: '2',
    title: 'The Resonance Engine',
    authors: [{ id: 'a2', name: 'Marcus Chen' }],
    narrator: 'Emma Watson',
    cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&h=600&q=80',
    duration_seconds: 36000, // 10 hours
    chapters: [
      { id: 'ch1', title: 'Prologue: The Awakening', duration: 2400, start_time: 0 },
      { id: 'ch2', title: 'Chapter 1: First Contact', duration: 2100, start_time: 2400 },
      { id: 'ch3', title: 'Chapter 2: The Resonance', duration: 2250, start_time: 4500 },
      { id: 'ch4', title: 'Chapter 3: Beyond Reality', duration: 1980, start_time: 6750 }
    ],
    rating: 4.9,
    rating_count: 2156
  },
  {
    id: 'audio-3',
    book_id: '4',
    title: 'The Last Library',
    authors: [{ id: 'a4', name: 'David Thompson' }],
    narrator: 'Michael Caine',
    cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&h=600&q=80',
    duration_seconds: 25200, // 7 hours
    chapters: [
      { id: 'ch1', title: 'Chapter 1: The Forbidden', duration: 1800, start_time: 0 },
      { id: 'ch2', title: 'Chapter 2: The Keeper', duration: 1950, start_time: 1800 },
      { id: 'ch3', title: 'Chapter 3: Hidden Knowledge', duration: 2100, start_time: 3750 }
    ],
    rating: 4.7,
    rating_count: 1567
  }
];

export const getAudiobookById = (id) => {
  return mockAudiobooks.find(audio => audio.id === id) || null;
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

