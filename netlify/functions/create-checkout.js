// Creates a Stripe Checkout session for deposit payments
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { stripeKey, amount, customerEmail, customerName, tripDate, tripType, businessName, bookingId } = JSON.parse(event.body);

    if (!stripeKey || !amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing stripeKey or amount' }) };
    }

    // Dynamic import of Stripe
    const stripe = require('stripe')(stripeKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: (businessName || "KJ's Outdoor Adventures") + ' - Trip Deposit',
            description: 'Deposit for ' + (tripType || 'fishing trip') + ' on ' + (tripDate || 'TBD') + ' with ' + (businessName || "KJ's Outdoor Adventures"),
          },
          unit_amount: amount, // already in cents
        },
        quantity: 1,
      }],
      metadata: {
        bookingId: bookingId || '',
        customerName: customerName || '',
        tripDate: tripDate || '',
        tripType: tripType || ''
      },
      success_url: event.headers.origin + '/admin.html?deposit=success&booking=' + (bookingId || ''),
      cancel_url: event.headers.origin + '/admin.html?deposit=cancelled',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id })
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
