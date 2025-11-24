import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AudiobookPlayerPage.css';

// Mock audiobook data for beta
const MOCK_AUDIOBOOKS = {
  'audio-1': {
    id: 'audio-1',
    title: 'The Great Adventure',
    author: 'Jane Smith',
    narrator: 'Michael Roberts',
    coverUrl: 'https://picsum.photos/seed/audiobook1/400/400',
    duration: '8h 32m',
    chapters: [
      { id: 1, title: 'Chapter 1: The Beginning', duration: '45:00', startTime: 0 },
      { id: 2, title: 'Chapter 2: The Journey', duration: '52:00', startTime: 2700 },
      { id: 3, title: 'Chapter 3: The Challenge', duration: '48:00', startTime: 5820 },
      { id: 4, title: 'Chapter 4: The Discovery', duration: '55:00', startTime: 8700 },
      { id: 5, title: 'Chapter 5: The Return', duration: '50:00', startTime: 12000 }
    ],
    description: 'An epic journey through unknown lands filled with mystery and wonder.',
    rating: 4.5,
    ratingCount: 128
  }
};

function AudiobookPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [audiobook, setAudiobook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    // Simulate API call with mock data
    setLoading(true);
    setTimeout(() => {
      const book = MOCK_AUDIOBOOKS[id] || MOCK_AUDIOBOOKS['audio-1'];
      setAudiobook(book);
      setLoading(false);
    }, 300);
  }, [id]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    setCurrentTime(prev => prev + 30);
  };

  const skipBackward = () => {
    setCurrentTime(prev => Math.max(0, prev - 30));
  };

  const handleChapterSelect = (chapterIndex) => {
    setCurrentChapter(chapterIndex);
    if (audiobook?.chapters[chapterIndex]) {
      setCurrentTime(audiobook.chapters[chapterIndex].startTime);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="audiobook-player-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading audiobook...</div>
        </div>
      </div>
    );
  }

  if (!audiobook) {
    return (
      <div className="audiobook-player-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Audiobook Not Found</h2>
          <p>The audiobook you're looking for doesn't exist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/library')}>
            Browse Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="audiobook-player-page">
      {/* Header with back button */}
      <header className="player-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="player-header-actions">
          <button className="icon-btn" title="Bookmark">
            <i className="fas fa-bookmark"></i>
          </button>
          <button className="icon-btn" title="Share">
            <i className="fas fa-share-alt"></i>
          </button>
          <button className="icon-btn" title="More options">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </header>

      {/* Main player content */}
      <main className="player-main">
        <div className="player-content">
          {/* Album art and info */}
          <div className="player-cover-section">
            <div className="player-cover">
              <img src={audiobook.coverUrl} alt={audiobook.title} />
              {isPlaying && <div className="playing-indicator">
                <span></span><span></span><span></span>
              </div>}
            </div>
            <div className="player-info">
              <h1 className="player-title">{audiobook.title}</h1>
              <p className="player-author">By {audiobook.author}</p>
              <p className="player-narrator">Narrated by {audiobook.narrator}</p>
              <div className="player-rating">
                <span className="stars">{'★'.repeat(Math.round(audiobook.rating))}{'☆'.repeat(5 - Math.round(audiobook.rating))}</span>
                <span className="rating-text">{audiobook.rating} ({audiobook.ratingCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="player-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentTime / 30720) * 100}%` }}
              ></div>
              <div
                className="progress-handle"
                style={{ left: `${(currentTime / 30720) * 100}%` }}
              ></div>
            </div>
            <div className="progress-times">
              <span>{formatTime(currentTime)}</span>
              <span>{audiobook.duration}</span>
            </div>
          </div>

          {/* Player controls */}
          <div className="player-controls">
            <button className="control-btn speed-btn" onClick={handleSpeedChange}>
              {playbackSpeed}x
            </button>
            <button className="control-btn" onClick={skipBackward}>
              <i className="fas fa-backward"></i>
              <span className="skip-label">30s</span>
            </button>
            <button className="control-btn play-pause-btn" onClick={togglePlayPause}>
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button className="control-btn" onClick={skipForward}>
              <i className="fas fa-forward"></i>
              <span className="skip-label">30s</span>
            </button>
            <button className="control-btn volume-btn">
              <i className={`fas ${volume > 50 ? 'fa-volume-up' : volume > 0 ? 'fa-volume-down' : 'fa-volume-mute'}`}></i>
            </button>
          </div>

          {/* Secondary controls */}
          <div className="player-secondary-controls">
            <button className="secondary-btn">
              <i className="fas fa-moon"></i> Sleep Timer
            </button>
            <button className="secondary-btn">
              <i className="fas fa-download"></i> Download
            </button>
            <button className="secondary-btn">
              <i className="fas fa-car"></i> Car Mode
            </button>
          </div>
        </div>

        {/* Chapter list */}
        <aside className="chapter-list">
          <h2>Chapters</h2>
          <div className="chapters">
            {audiobook.chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                className={`chapter-item ${currentChapter === index ? 'active' : ''}`}
                onClick={() => handleChapterSelect(index)}
              >
                <div className="chapter-info">
                  <span className="chapter-number">{index + 1}</span>
                  <span className="chapter-title">{chapter.title}</span>
                </div>
                <span className="chapter-duration">{chapter.duration}</span>
              </button>
            ))}
          </div>
        </aside>
      </main>

      {/* Mini player bar (for mobile or when scrolled) */}
      <div className="mini-player">
        <img src={audiobook.coverUrl} alt={audiobook.title} className="mini-cover" />
        <div className="mini-info">
          <span className="mini-title">{audiobook.title}</span>
          <span className="mini-chapter">{audiobook.chapters[currentChapter]?.title}</span>
        </div>
        <button className="mini-play-btn" onClick={togglePlayPause}>
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
        </button>
      </div>
    </div>
  );
}

export default AudiobookPlayerPage;
