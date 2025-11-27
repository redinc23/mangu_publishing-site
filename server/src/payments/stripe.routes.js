import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

// Create Checkout Session (simple, expects array of items with {name, amount, quantity})
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    const line_items = items.map(i => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.name || 'Item' },
        unit_amount: Number(i.amount || 0), // cents
      },
      quantity: Number(i.quantity || 1),
    }));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: (process.env.FRONTEND_URL || 'http://localhost:5174') + '/?success=1',
      cancel_url: (process.env.FRONTEND_URL || 'http://localhost:5174') + '/?canceled=1',
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('stripe session error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
