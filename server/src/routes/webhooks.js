import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe
 * Handles payment events and updates orders accordingly
 */
export async function handleStripeWebhook(req, res) {
  const db = req.app.locals.db;
  
  if (!db) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, db);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, db);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle successful payment
 * 2. Mark order completed and add books to user_library
 */
async function handlePaymentIntentSucceeded(paymentIntent, db) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Find order by payment_intent_id
    const orderResult = await client.query(
      `SELECT id, user_id, status FROM orders WHERE payment_intent_id = $1`,
      [paymentIntent.id]
    );

    if (orderResult.rows.length === 0) {
      console.warn(`No order found for payment_intent: ${paymentIntent.id}`);
      await client.query('ROLLBACK');
      return;
    }

    const order = orderResult.rows[0];

    // Update order status to completed
    await client.query(
      `UPDATE orders 
       SET status = 'completed', 
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id]
    );

    // Get all books from order items
    const orderItemsResult = await client.query(
      `SELECT book_id FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    // Add books to user_library
    for (const item of orderItemsResult.rows) {
      await client.query(
        `INSERT INTO user_library (user_id, book_id, added_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, book_id) DO NOTHING`,
        [order.user_id, item.book_id]
      );
    }

    await client.query('COMMIT');
    console.log(`Order ${order.id} completed successfully. Books added to library for user ${order.user_id}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error handling payment success:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Handle failed payment
 * 3. Mark order as failed
 */
async function handlePaymentIntentFailed(paymentIntent, db) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Update order status to failed (using 'cancelled' as closest match to failed)
    const result = await client.query(
      `UPDATE orders 
       SET status = 'cancelled',
           payment_metadata = payment_metadata || $2::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_intent_id = $1
       RETURNING id`,
      [
        paymentIntent.id,
        JSON.stringify({
          failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
          failed_at: new Date().toISOString()
        })
      ]
    );

    await client.query('COMMIT');

    if (result.rows.length > 0) {
      console.log(`Order ${result.rows[0].id} marked as failed for payment_intent: ${paymentIntent.id}`);
    } else {
      console.warn(`No order found for failed payment_intent: ${paymentIntent.id}`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error handling payment failure:', err);
    throw err;
  } finally {
    client.release();
  }
}
