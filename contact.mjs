export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    }

    let form;
    try {
      form = await request.json();
    } catch {
      return Response.json({ error: 'Please send valid form data.' }, { status: 400 });
    }

    // Quietly ignore simple bot submissions caught by the hidden honeypot.
    if (typeof form.website === 'string' && form.website.trim()) {
      return Response.json({ ok: true });
    }

    const name = typeof form.name === 'string' ? form.name.trim().slice(0, 100) : '';
    const email = typeof form.email === 'string' ? form.email.trim().slice(0, 254) : '';
    const contact = typeof form.contact === 'string' ? form.contact.trim().slice(0, 200) : '';
    const message = typeof form.message === 'string' ? form.message.trim().slice(0, 5000) : '';

    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter your name, a valid email, and a message.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'The contact service is not configured yet.' }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jeslin Portfolio <onboarding@resend.dev>',
        to: ['nadarjeslin04@gmail.com'],
        reply_to: email,
        subject: `Portfolio message from ${name.replace(/[\r\n]+/g, ' ')}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Contact details: ${contact || 'Not provided'}`,
          '',
          'Message:',
          message,
        ].join('\n'),
      }),
    });

    if (!emailResponse.ok) {
      return Response.json({ error: 'Your message could not be sent right now. Please try again later.' }, { status: 502 });
    }

    return Response.json({ ok: true });
  },
};
