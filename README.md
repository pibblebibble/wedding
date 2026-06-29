# Jonathan &amp; Vivien — Wedding RSVP

A static four-page RSVP site for our wedding reception brunch on **1 November 2026**.

Built with plain HTML / CSS / JS — no framework, no build step. Hosts free on GitHub Pages.

## Pages

- `index.html` — Welcome
- `rsvp.html` — RSVP form (submits to [Formspree](https://formspree.io))
- `details.html` — Reception details, schedule, map, dress code
- `thank-you.html` — Confirmation after submission

## Local preview

Any static-file server works. From this folder:

```bash
python -m http.server 5571
```

Then open `http://localhost:5571`.

## Form submissions

The RSVP form posts to a Formspree endpoint set on the `<form action>` in `rsvp.html`. Responses land in the Formspree dashboard with email notifications.

## Design tokens

Palette: ivory &amp; sage with champagne gold accents. Type: Cormorant Garamond (display, italic) + Inter (body). Defined in `css/style.css`.
