import React, { useContext, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { apiClient } from '../lib/api';
import { mockBooks } from '../data/mockBooks';

const TAX_RATE = 0.07;
const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CartPageV2() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartSubtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    addToCart
  } = useContext(CartContext);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const totals = useMemo(() => {
    const discount = cartSubtotal > 3000 ? Math.round(cartSubtotal * 0.1) : 0;
    const taxable = cartSubtotal - discount;
    const tax = Math.round(taxable * TAX_RATE);
    const total = taxable + tax;
    return { discount, tax, total };
  }, [cartSubtotal]);

  const recommendedBooks = useMemo(() => {
    const inCart = new Set(cartItems.map((item) => item.id));
    return mockBooks.filter((book) => !inCart.has(book.id)).slice(0, 3);
  }, [cartItems]);

  const isCartEmpty = cartItems.length === 0;

  const handleCheckout = async () => {
    if (isCartEmpty) return;
    
    setCheckoutLoading(true);
    setCheckoutError(null);
    
    try {
      // Transform cart items to Stripe format
      const items = cartItems.map((item) => ({
        name: item.title || 'Book',
        amount: item.price_cents || 0,
        quantity: item.quantity || 1,
      }));

      const response = await apiClient.payments.createCheckoutSession({ items });
      
      if (response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Failed to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen px-6 py-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Cart</p>
              <h1 className="text-4xl font-bold mt-2">Ready when you are.</h1>
              <p className="text-white/70 mt-2 max-w-2xl">
                Add any mock book from the details page and it appears here instantly. No backend calls, just deterministic local state for smoother demos.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60">Subtotal</p>
              <p className="text-3xl font-semibold">{formatCurrency(cartSubtotal)}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Continue browsing
            </button>
            {!isCartEmpty && (
              <button
                type="button"
                onClick={clearCart}
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 hover:text-white"
              >
                Clear cart
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.35fr,0.65fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Items</h2>
              <span className="text-sm text-white/60">
                {cartItems.length} {cartItems.length === 1 ? 'selection' : 'selections'}
              </span>
            </div>
            {isCartEmpty ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/70">
                <p>Your cart is empty. Jump to the <Link className="text-white underline" to="/library">library</Link> or open <Link className="text-white underline" to="/book/1">/book/1</Link> to add something.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((book) => (
                  <article
                    key={book.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 md:flex-row md:items-center"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="h-28 w-24 rounded-2xl object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-white/50">
                          {book.categories?.[0] || 'Featured'}
                        </p>
                        <h3 className="text-xl font-semibold">{book.title}</h3>
                        <p className="text-white/70 text-sm">
                          {book.authors?.map((a) => a.name).join(', ')}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="mt-2 text-sm text-white/80 hover:text-white"
                        >
                          View details →
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-white/60">
                        Qty
                        <input
                          type="number"
                          min="1"
                          value={book.quantity}
                          onChange={(event) =>
                            updateQuantity(book.id, Number(event.target.value))
                          }
                          className="mt-1 w-20 rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-white"
                        />
                      </label>
                      <p className="text-base font-semibold">
                        {formatCurrency((book.price_cents || 0) * book.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(book.id)}
                        className="text-sm text-white/60 hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Summary</h2>
              <div className="space-y-3 text-sm text-white/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Beta discount</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated tax</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCartEmpty || checkoutLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ff6b00] to-[#ff3d00] px-4 py-3 text-base font-semibold shadow-lg shadow-[#ff6b0044] transition hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutLoading ? 'Processing...' : 'Checkout'}
              </button>
              {checkoutError && (
                <p className="text-xs text-red-400 mt-2">{checkoutError}</p>
              )}
              {!checkoutError && (
                <p className="text-xs text-white/60">
                  Secure checkout powered by Stripe
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Need one more?</h3>
                <Link to="/library" className="text-sm text-white/70 hover:text-white">
                  Library →
                </Link>
              </div>
              <div className="space-y-3">
                {recommendedBooks.map((book) => (
                  <div key={book.id} className="flex items-center gap-3">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="h-16 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-sm text-white/80">
                      <p className="font-semibold text-white">{book.title}</p>
                      <p>{book.authors?.[0]?.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(book.id)}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

