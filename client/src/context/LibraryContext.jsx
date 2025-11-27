import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getBookById } from '../data/mockBooks';

const STORAGE_KEY = 'mangu-library';
const isBrowser = typeof window !== 'undefined';

const parseStoredIds = (rawValue) => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === 'string')
      : [];
  } catch (error) {
    console.warn('[library] Failed to parse saved list', error);
    return [];
  }
};

const loadInitialIds = () => {
  if (!isBrowser) return [];
  return parseStoredIds(window.localStorage.getItem(STORAGE_KEY));
};

export const LibraryContext = createContext({
  libraryItems: [],
  addToLibrary: () => {},
  removeFromLibrary: () => {},
  isInLibrary: () => false
});

export const LibraryProvider = ({ children }) => {
  const [libraryIds, setLibraryIds] = useState(loadInitialIds);

  useEffect(() => {
    if (!isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(libraryIds));
  }, [libraryIds]);

  const libraryItems = useMemo(
    () => libraryIds.map((id) => getBookById(id)).filter(Boolean),
    [libraryIds]
  );

  const addToLibrary = useCallback((bookId) => {
    if (!bookId) return;
    setLibraryIds((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
  }, []);

  const removeFromLibrary = useCallback((bookId) => {
    setLibraryIds((prev) => prev.filter((id) => id !== bookId));
  }, []);

  const isInLibrary = useCallback(
    (bookId) => libraryIds.includes(bookId),
    [libraryIds]
  );

  const value = {
    libraryItems,
    addToLibrary,
    removeFromLibrary,
    isInLibrary
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};
