# Argument Atlas (Debattic)

**Arguments worth having.**

Argument Atlas (working name: Debattic) is a platform that helps citizens understand what other citizens think. It structures arguments and debates so that public discourse is easier to navigate — surfacing what people find persuasive, and over time generating structured data that can supplement polling and policy analysis.

It's the technology project of the Engage for Australia movement, which aims to make public discourse more informed by facts and more relevant to community needs.

The design philosophy is closer to Wikipedia than a social network: the argument or debate is the unit, not the person or the post. Structure and quality matter more than recency or identity.

## Project structure

- `requirements.md` — full product requirements, brand tone, colour palette, and UI specification.
- `backend/` — the Express 5 + Prisma API. `npm run seed` loads the seed content; `npm run seed:check` validates it without touching the database.
- `frontend/` — the Next.js 16 application.

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript, CSS Modules with design-token custom properties
- Prisma ORM with Postgres (local `prisma dev`)
- Better Auth for authentication (email/password, Google, Microsoft, TOTP, passkeys)
- Standalone Express 5 API

## Getting started

```bash
# API (http://localhost:4000)
cd backend
npm install
npm run seed        # loads the seed content into the local Postgres
npm run dev

# Web app (http://localhost:3000), in a second terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The API runs on http://localhost:4000. See `frontend/README.md` for Next.js-specific notes.

## License

GNU GPLv3 — see LICENSE.
