# Argument Atlas (Debattic)

**Arguments worth having.**

Argument Atlas (working name: Debattic) is a platform that helps citizens understand what other citizens think. It structures arguments and debates so that public discourse is easier to navigate — surfacing what people find persuasive, and over time generating structured data that can supplement polling and policy analysis.

It's the technology project of the Engage for Australia movement, which aims to make public discourse more informed by facts and more relevant to community needs.

The design philosophy is closer to Wikipedia than a social network: the argument or debate is the unit, not the person or the post. Structure and quality matter more than recency or identity.

## Project structure

- `requirements.md` — full product requirements, brand tone, colour palette, and UI specification.
- `code/` — the Next.js application.

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript, Tailwind CSS 4
- Prisma ORM with SQLite (libsql / better-sqlite3)
- NextAuth 5 for authentication
- Pusher for realtime updates

## Getting started

\`\`\`bash
cd code
npm install
npm run dev
\`\`\`

Open http://localhost:3000. See `code/README.md` for Next.js-specific notes.

## License

GNU GPLv3 — see LICENSE.
