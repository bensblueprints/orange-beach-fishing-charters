// Sends deposit request email to customer via Resend API
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
    const { email, name, amount, paymentUrl, tripDate, bizName, phone } = JSON.parse(event.body);

    if (!email || !paymentUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email or paymentUrl' }) };
    }

    const RESEND_KEY = process.env.RESEND_API_KEY || 're_TqppzRWt_LdZL9X1dzPPB4bpS4riMeNHV';
    const businessName = bizName || "Orange Beach Fishing Charters";
    const captainPhone = phone || '(251) 265-1122';
    const customerName = name || 'Valued Customer';
    const depositAmount = amount || 0;
    const date = tripDate || 'your upcoming trip';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;">
  <div style="max-width:600px;margin:0 auto;padding:2rem;">
    <div style="background:#0b1a2e;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
      <!-- Header -->
      <div style="padding:2rem 2rem 1rem;text-align:center;">
        <h1 style="color:#f59e0b;font-size:1.5rem;margin:0 0 0.25rem;letter-spacing:2px;">${businessName}</h1>
        <p style="color:#94a3b8;font-size:0.85rem;margin:0;">Deposit Request</p>
      </div>

      <!-- Body -->
      <div style="padding:1.5rem 2rem;">
        <p style="color:#e2e8f0;font-size:1rem;line-height:1.7;">Hi ${customerName},</p>
        <p style="color:#cbd5e1;font-size:0.95rem;line-height:1.7;">Thank you for booking your fishing trip with ${businessName}! To secure your reservation for <strong style="color:#f59e0b;">${date}</strong>, please submit your deposit below.</p>

        <div style="background:#112240;border-radius:12px;padding:1.5rem;margin:1.5rem 0;text-align:center;border:1px solid rgba(255,255,255,0.08);">
          <p style="color:#94a3b8;font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 0.5rem;">Deposit Amount</p>
          <p style="color:#ffffff;font-size:2.5rem;font-weight:700;margin:0;">$${depositAmount}</p>
        </div>

        <div style="text-align:center;margin:2rem 0;">
          <a href="${paymentUrl}" style="display:inline-block;background:#f59e0b;color:#0b1a2e;padding:1rem 2.5rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.05rem;letter-spacing:0.5px;">Pay Deposit Now &rarr;</a>
        </div>

        <p style="color:#64748b;font-size:0.85rem;line-height:1.6;text-align:center;">This deposit is refundable up to 7 days before your trip date. If you have any questions, call or text Captain KJ at <a href="tel:+18047613131" style="color:#0ea5e9;text-decoration:none;">${captainPhone}</a>.</p>
      </div>

      <!-- Footer -->
      <div style="padding:1.5rem 2rem;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#475569;font-size:0.75rem;margin:0;">&copy; ${new Date().getFullYear()} ${businessName}. King George, Virginia.</p>
        <p style="color:#475569;font-size:0.75rem;margin:0.25rem 0 0;">USCG Licensed &amp; Insured</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: businessName + ' <bookings@advancedmarketing.co>',
        to: [email],
        subject: 'Deposit Request - ' + businessName + ' Fishing Trip (' + date + ')',
        html: html
      })
    });

    const result = await resp.json();

    if (!resp.ok) {
      console.error('Resend error:', result);
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: result.message || 'Email failed' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: result.id })
    };
  } catch (err) {
    console.error('Email error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
