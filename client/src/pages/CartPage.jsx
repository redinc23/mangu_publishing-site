import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './CartPage.css';

const PROMO_CODES = {
  READMORE: {
    code: 'READMORE',
    discount: 0.15,
    label: '15% off for avid readers'
  },
  WELCOME10: {
    code: 'WELCOME10',
    discount: 0.1,
    label: '10% off your first order'
  },
  AUDIOLOVE: {
    code: 'AUDIOLOVE',
    discount: 0.2,
    label: 'Bundle discount on audiobooks'
  }
};

const FALLBACK_PRICE_CENTS = 1899;
const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`;
const resolvePrice = (book) => {
  if (typeof book?.price_cents === 'number') return book.price_cents;
  if (typeof book?.price === 'number') return Math.round(book.price * 100);
  return FALLBACK_PRICE_CENTS;
};

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart, clearCart } = useContext(CartContext);

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const isCartEmpty = !cartItems || cartItems.length === 0;

  useEffect(() => {
    const controller = new AbortController();
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const response = await fetch('http://localhost:5000/api/books/trending', {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Failed to load recommendations');
        }
        const data = await response.json();
        setRecommendations(data.slice(0, 6));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading recommendations:', error);
        }
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecommendations();
    return () => controller.abort();
  }, []);

  const totals = useMemo(() => {
    const subtotal = (cartItems || []).reduce((sum, book) => sum + resolvePrice(book), 0);
    const discount = appliedPromo ? Math.round(subtotal * appliedPromo.discount) : 0;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.07);
    const total = taxable + tax;

    return { subtotal, discount, tax, total };
  }, [cartItems, appliedPromo]);

  const handlePromoSubmit = (event) => {
    event.preventDefault();
    const normalized = promoCode.trim().toUpperCase();

    if (!normalized) {
      setPromoError('Enter a promo or gift code.');
      return;
    }

    const promo = PROMO_CODES[normalized];
    if (!promo) {
      setAppliedPromo(null);
      setPromoError('Code not recognised. Try READMORE or WELCOME10.');
      return;
    }

    setAppliedPromo(promo);
    setPromoError('');
  };

  const handleClearPromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleCheckout = () => {
    if (isCartEmpty) return;
    console.info('Checkout flow coming soon.');
  };

  const handleContinueShopping = () => navigate('/library');
  const handleRemove = (bookId) => removeFromCart(bookId);

  const handleShuffleRecommendations = () => {
    setRecommendations(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="cart-page">
      <section className="cart-hero">
        <div className="cart-hero-text">
          <h1>Your cart, ready for adventure</h1>
          <p>
            Checkout now to unlock immersive audiobooks, exclusive author sessions,
            and bonus chapters curated just for you.
          </p>
          <div className="cart-hero-actions">
            <button
              className="cart-hero-btn primary"
              onClick={handleCheckout}
              disabled={isCartEmpty}
            >
              Proceed to checkout
            </button>
            <button className="cart-hero-btn" onClick={handleContinueShopping}>
              Continue browsing
            </button>
          </div>
          {!isCartEmpty && (
            <div className="cart-hero-meta">
              <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          )}
        </div>
        <div className="cart-hero-card">
          <h3>Included with every purchase</h3>
          <ul>
            <li><i className="fas fa-headphones"></i> Sync reading and listening across devices</li>
            <li><i className="fas fa-cloud-download-alt"></i> Offline access in the MANGU app</li>
            <li><i className="fas fa-shield-alt"></i> 30-day satisfaction guarantee</li>
          </ul>
        </div>
      </section>

      <section className="cart-content">
        <div className="cart-items-panel">
          <div className="cart-panel-heading">
            <h2>Items in your cart</h2>
            {!isCartEmpty && (
              <button className="cart-clear-btn" onClick={clearCart}>
                <i className="fas fa-trash-alt"></i> Clear cart
              </button>
            )}
          </div>

          {isCartEmpty ? (
            <div className="cart-empty-state">
              <div className="empty-icon">
                <i className="fas fa-shopping-basket"></i>
              </div>
              <h3>Your cart is feeling light</h3>
              <p>Add books, audiobooks, magazines, or documentaries to build your perfect queue.</p>
              <button className="cart-empty-cta" onClick={handleContinueShopping}>
                Browse the library
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map(book => (
                <div
                  key={book.id}
                  className="cart-item"
                  onClick={() => navigate(`/book/${book.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') navigate(`/book/${book.id}`);
                  }}
                >
                  <div className="cart-item-cover">
                    <img
                      src={
                        book.cover ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={book.title}
                    />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-header">
                      <h3>{book.title}</h3>
                      <button
                        className="cart-item-remove"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(book.id);
                        }}
                        aria-label={`Remove ${book.title} from cart`}
                        type="button"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <p className="cart-item-author">
                      By {book.authors?.map(author => author.name).join(', ') || book.author}
                    </p>
                    <div className="cart-item-meta">
                      {book.genre && <span className="meta-chip">{book.genre}</span>}
                      {book.year && <span className="meta-chip">Published {book.year}</span>}
                      {book.rating && (
                        <span className="meta-chip">
                          <i className="fas fa-star"></i> {parseFloat(book.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="cart-item-description">
                      {book.description || 'An epic story waiting to unfold.'}
                    </p>
                    <div className="cart-item-footer">
                      <span className="cart-item-price">{formatCurrency(resolvePrice(book))}</span>
                      <div className="cart-item-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/book/${book.id}`);
                          }}
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            console.info('Wishlist support coming soon.');
                          }}
                        >
                          Save for later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-summary-panel">
          <div className="summary-card">
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Estimated tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className={`summary-row ${appliedPromo ? 'discount' : ''}`}>
              <span>Promotion</span>
              <span>{appliedPromo ? `-${formatCurrency(totals.discount)}` : '$0.00'}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-total">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            <button
              className="summary-checkout-btn"
              onClick={handleCheckout}
              disabled={isCartEmpty}
            >
              Complete purchase
            </button>
          </div>

          <form className="promo-card" onSubmit={handlePromoSubmit}>
            <label htmlFor="promo" className="promo-label">
              Add promo or gift code
            </label>
            <div className="promo-input-group">
              <input
                id="promo"
                type="text"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value)}
                placeholder="READMORE"
              />
              <button type="submit">Apply</button>
            </div>
            {promoError && <p className="promo-error">{promoError}</p>}
            {appliedPromo && (
              <div className="promo-applied">
                <span><i className="fas fa-tags"></i> {appliedPromo.label}</span>
                <button type="button" onClick={handleClearPromo}>
                  Remove
                </button>
              </div>
            )}
          </form>

          <div className="cart-perks-card">
            <h3>Member perks</h3>
            <ul>
              <li><i className="fas fa-sync-alt"></i> Continue reading anywhere, anytime.</li>
              <li><i className="fas fa-users"></i> Share with family at no extra cost.</li>
              <li><i className="fas fa-gift"></i> Surprise drops and bonus chapters monthly.</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="cart-recommendations">
        <div className="recommendations-header">
          <h2>Readers also enjoyed</h2>
          <button className="recommendations-refresh" onClick={handleShuffleRecommendations}>
            <i className="fas fa-sync"></i> Shuffle picks
          </button>
        </div>

          {loadingRecommendations ? (
            <div className="recommendations-loading">
              <div className="spinner" />
              <p>Collecting stories tailored to you…</p>
            </div>
          ) : (
            <div className="recommendations-grid">
              {recommendations.map(book => (
                <article key={book.id} className="recommendation-card">
                  <Link to={`/book/${book.id}`} className="recommendation-cover" aria-label={`View details for ${book.title}`}>
                    <img src={book.cover} alt={book.title} />
                  </Link>
                  <div className="recommendation-body">
                    <Link to={`/book/${book.id}`}>
                      <h3>{book.title}</h3>
                    </Link>
                    <p>{book.author}</p>
                    <div className="recommendation-meta">
                      <span>{book.genre || 'Literature'}</span>
                      {book.rating && (
                        <span><i className="fas fa-star"></i> {parseFloat(book.rating).toFixed(1)}</span>
                      )}
                    </div>
                    <div className="recommendation-actions">
                      <Link to={`/book/${book.id}`} className="ghost-button">
                        Preview book
                      </Link>
                      <button
                        type="button"
                        onClick={() => addToCart(book.id)}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

export default CartPage;
