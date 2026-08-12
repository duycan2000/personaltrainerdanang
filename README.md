# personaltrainerdanang.com — In-Person Da Nang

Static site for Cloudflare Pages. Plain HTML/CSS + one Cloudflare Pages
Function for the contact form.

## Structure

```
.
├── index.html                 # the page
├── css/styles.css
├── assets/img/...             # images
└── functions/
    └── api/
        └── contact.js         # POST /api/contact  (runs on Cloudflare Workers runtime)
```

## Deploy (GitHub → Cloudflare Pages)

1. Push this whole folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo. Build settings: **Framework preset = None**, **Build command = (empty)**,
   **Build output directory = /** (the root). Deploy.
4. Add your custom domain `www.personaltrainerdanang.com` under the project's
   **Custom domains** tab.

The `functions/` folder is picked up automatically — no separate Worker deploy.

## Contact form email (Resend)

The form POSTs to `/api/contact`, which emails you via **Resend**
(MailChannels' free Cloudflare service ended June 2024).

1. Sign up at <https://resend.com> (free tier is plenty for a contact form).
2. **Add & verify your domain** `personaltrainerdanang.com` in Resend — it gives
   you a few DNS records to add. Your DNS is on Cloudflare, so this is quick.
3. Create an **API key** (Sending permission).
4. Cloudflare → Pages project → **Settings → Variables and Secrets**, add:

   | Name             | Type   | Example                                        |
   |------------------|--------|------------------------------------------------|
   | `RESEND_API_KEY` | Secret | `re_xxxxxxxxxxxxxxxxxxxx`                       |
   | `CONTACT_TO`     | Text   | `ian@personaltrainerdanang.com`                |
   | `CONTACT_FROM`   | Text   | `Website <hello@personaltrainerdanang.com>`    |

   `CONTACT_FROM` must be on the domain you verified in Resend.
5. Redeploy. Done — submissions land in the `CONTACT_TO` inbox, and hitting
   **Reply** goes straight to the visitor (when they left an email).

### Spam protection
A hidden honeypot field is already built in. If you want more, add
[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) later.

## Notes
- Bump the `?v=` on the stylesheet link in `index.html` whenever you edit
  `css/styles.css`, so browsers don't serve a stale cached copy.
- The "Online Coaching" links point to `https://mindmuscletraining.fit`.
