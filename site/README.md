# HotelOS — Marketing Website

Premium, frontend-only SaaS marketing site for HotelOS. Pure **HTML + Tailwind CSS** (CDN), **Lucide icons**, static mock data, no backend.

## Run

Open `site/index.html`, or serve the folder:

```bash
npx serve site
```

## Pages

| File | Route | Notes |
|------|-------|-------|
| `index.html` | `/` | Hero, trusted-by, features, screenshots, benefits, AI chat, testimonials, pricing, FAQ, final CTA |
| `features.html` | `/features` | Alternating feature rows + grid |
| `pricing.html` | `/pricing` | 3 plans + comparison table + FAQ |
| `about.html` | `/about` | Mission, stats, team |
| `contact.html` | `/contact` | Contact + demo form |
| `faq.html` | `/faq` | Grouped accordion |
| `login.html` | `/login` | Split-screen auth |
| `signup.html` | `/signup` | Split-screen, links to onboarding |
| `onboarding.html` | `/onboarding` | 5-step wizard with progress indicator |

## Architecture

`assets/site.js` holds the reusable chrome and helpers, injected via `mountChrome(activeNav)`:
- `navbar` — sticky, blur background, mobile drawer
- `footer` — 4 link columns + socials
- `SITE.badge`, `SITE.sectionHead` — shared section primitives
- Accordion behavior wired through `[data-accordion]`

Each page is a thin HTML shell that builds its content from small data arrays + the shared helpers — Next.js-style component composition expressed in vanilla JS.

## Design tokens

Primary `#4F46E5` / hover `#4338CA`, accent gradient `from-indigo-600 to-violet-600`, Success `#059669`, Warning `#F59E0B`, Danger `#DC2626`, Background `#FAFAFA`, Border `#E5E7EB`. Inter typeface, 12–16px radii, soft shadows, smooth hover states.

> The dashboard app this site markets lives one level up in the repo root (`../index.html`). The onboarding "Go to Dashboard" button and screenshot links point there.
