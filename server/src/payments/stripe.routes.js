import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

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
      success_url: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/?success=1',
      cancel_url: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/?canceled=1',
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('stripe session error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Stripe Webhook Handler
// NOTE: This route requires raw body, must be mounted BEFORE express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log('✅ Webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('💳 Payment succeeded for session:', session.id);

        // TODO: Fulfill the order
        // - Update order status in database
        // - Grant access to purchased books
        // - Send confirmation email

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('⏰ Checkout session expired:', session.id);
        // TODO: Clean up abandoned cart
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('💰 Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('❌ Payment failed:', paymentIntent.id);
        // TODO: Notify user of payment failure
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
