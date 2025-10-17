import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, afterEach, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CartPage from '../../src/pages/CartPage';
import { CartContext } from '../../src/context/CartContext';

describe('CartPage', () => {
  const originalFetch = global.fetch;

  const sampleCartItems = [
    {
      id: 101,
      title: 'Starfall Over Mangu',
      price_cents: 1599,
      genre: 'Speculative Fiction',
      rating: 4.8,
      year: 2024,
      description: 'A cosmic journey through forgotten libraries.',
      authors: [{ name: 'Lena Amani' }],
      cover: 'https://example.com/cover.jpg'
    }
  ];

  const sampleRecommendations = [
    {
      id: 301,
      title: 'Voices of the Dunes',
      author: 'Rael Osei',
      genre: 'Drama',
      rating: 4.6,
      cover: 'https://example.com/reco.jpg'
    }
  ];

  const setup = (cartItems = sampleCartItems) => {
    const addToCart = vi.fn();
    const removeFromCart = vi.fn();
    const clearCart = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sampleRecommendations)
    });

    render(
      <MemoryRouter initialEntries={['/cart']}>
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
          <CartPage />
        </CartContext.Provider>
      </MemoryRouter>
    );

    return { addToCart, removeFromCart, clearCart };
  };

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('renders cart summary and allows removing an item', async () => {
    const { removeFromCart } = setup();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(
      await screen.findByRole('heading', { name: /your cart, ready for adventure/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Starfall Over Mangu')).toBeInTheDocument();
    const priceSpans = screen.getAllByText('$15.99');
    expect(priceSpans.length).toBeGreaterThan(0);
    expect(priceSpans[0]).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /complete purchase/i })
    ).toBeEnabled();

    const removeButton = screen.getByRole('button', { name: /remove starfall over mangu from cart/i });
    await userEvent.click(removeButton);

    expect(removeFromCart).toHaveBeenCalledWith(101);
  });

  it('shows empty state when cart has no items', async () => {
    setup([]);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(await screen.findByText(/your cart is feeling light/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse the library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete purchase/i })).toBeDisabled();
  });
});
