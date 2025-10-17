import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi, beforeEach, afterEach, test, expect } from 'vitest';
import LibraryPage from '../../src/pages/LibraryPage';
import { CartContext } from '../../src/context/CartContext';
import { LibraryContext } from '../../src/context/LibraryContext';

const booksFixture = [
  {
    id: '1',
    title: 'To Kill a Mockingbird',
    authors: [{ name: 'Harper Lee' }]
  },
  {
    id: '2',
    title: 'Go Set a Watchman',
    authors: [{ name: 'Harper Lee' }]
  }
];

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (typeof url === 'string') {
      if (url.includes('/books/all/genres')) {
        return Promise.resolve({
          ok: true,
          json: async () => ['Fiction']
        });
      }

      if (
        url.includes('/books/trending') ||
        url.includes('/books/new-releases') ||
        url.includes('/books/top-rated')
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => booksFixture
        });
      }
    }

    return Promise.resolve({
      ok: true,
      json: async () => booksFixture
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders Library and can search by author', async () => {
  const router = createMemoryRouter(
    [{ path: '/library', element: <LibraryPage /> }],
    { initialEntries: ['/library'] }
  );

  const cartValue = { addToCart: vi.fn() };
  const libraryValue = { addToLibrary: vi.fn() };

  render(
    <CartContext.Provider value={cartValue}>
      <LibraryContext.Provider value={libraryValue}>
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true }}
        />
      </LibraryContext.Provider>
    </CartContext.Provider>
  );

  await screen.findByText(/discover your next great read/i);

  const user = userEvent.setup();
  const search = screen.getByPlaceholderText(/search by title/i);
  await user.clear(search);
  await user.type(search, 'Harper Lee');

  expect(
    await screen.findByRole('heading', { level: 2, name: /search results for "harper lee"/i })
  ).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledTimes(4);
});
