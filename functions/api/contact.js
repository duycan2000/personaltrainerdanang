/**
 * Cloudflare Pages Function — POST /api/contact
 * -------------------------------------------------------------
 * Runs on the Cloudflare Workers runtime and is deployed automatically
 * together with your Pages site (no separate Worker deploy needed).
 *
 * The contact form on index.html POSTs JSON here, and this sends you the
 * message by email through Resend (Cloudflare's currently recommended
 * provider — MailChannels' free service ended in June 2024).
 *
 * ── Setup (one time) ────────────────────────────────────────
 * 1. Create a free account at https://resend.com
 * 2. Add & verify your domain (personaltrainerdanang.com) in Resend
 *    → this adds a few DNS records; on Cloudflare DNS it's a couple of clicks.
 * 3. Create an API key (Sending permission).
 * 4. In the Cloudflare dashboard: Pages → your project → Settings →
 *    Variables and Secrets → add these (mark RESEND_API_KEY as a Secret):
 *
 *      RESEND_API_KEY   re_xxxxxxxxxxxxxxxxxxxx
 *      CONTACT_TO       ian@personaltrainerdanang.com      (where you read messages)
 *      CONTACT_FROM     Website <hello@personaltrainerdanang.com>   (must be on the verified domain)
 *
 * That's it. Redeploy and the form is live.
 * -------------------------------------------------------------
 */

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

export async function onRequestPost({ request, env }) {
  // Parse JSON body
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(data.name || "").trim();
  const contact = String(data.contact || "").trim();
  const message = String(data.message || "").trim();
  const honeypot = String(data.company || "").trim();

  // Honeypot tripped → almost certainly a bot. Pretend all is well, send nothing.
  if (honeypot) return json({ ok: true });

  // Validate
  if (!name || !contact || !message) {
    return json({ error: "Please fill in all three fields." }, 400);
  }
  if (name.length > 100 || contact.length > 150 || message.length > 5000) {
    return json({ error: "One of the fields is too long." }, 400);
  }

  // Make sure the server is configured
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    return json({ error: "The contact form isn't configured yet." }, 500);
  }

  const subject = `New enquiry from ${name} — personaltrainerdanang.com`;
  const html =
    `<h2 style="margin:0 0 12px">New contact form message</h2>` +
    `<p><strong>Name:</strong> ${escapeHtml(name)}</p>` +
    `<p><strong>Email / WhatsApp:</strong> ${escapeHtml(contact)}</p>` +
    `<p><strong>Message:</strong></p>` +
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;
  const text =
    `New contact form message\n\n` +
    `Name: ${name}\n` +
    `Email / WhatsApp: ${contact}\n\n` +
    `Message:\n${message}\n`;

  const body = {
    from: env.CONTACT_FROM,
    to: [env.CONTACT_TO],
    subject,
    html,
    text,
  };
  // If they left an email, make "Reply" go straight to them.
  if (contact.includes("@")) body.reply_to = contact;

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return json({ error: "Could not send right now. Please try WhatsApp." }, 502);
  }

  if (!res.ok) {
    return json({ error: "Could not send right now. Please try WhatsApp." }, 502);
  }

  return json({ ok: true });
}

// Only POST is defined, so Cloudflare Pages automatically returns
// 405 Method Not Allowed for GET/PUT/etc. to /api/contact.
