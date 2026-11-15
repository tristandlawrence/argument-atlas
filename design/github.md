repo: tristandlawrence/argument-atlas
branch: main

## Last sync

date: 2026-07-26T03:10:19Z

### Updated in this project

- Redesigned Home, Debate detail, and Argument detail + Results screens against the brand palette in `requirements.md` (teal / amber / sage / terracotta), which the coded UI was not using.
- Designed the Phase 2 dual-signal voting UI (persuasiveness + quality) replacing the binary for/against buttons.
- Added the persuasiveness × quality scatterplot: mini version on argument cards, full quadrant version (Compelling / Steelman / Partisan / Weak) on results.
- Three naming/brand-mark directions: Argument Atlas, Debattic, and a new option, Throughline.

## Screen map

| Screen | Built from |
| --- | --- |
| Brand exploration | requirements.md (Tone & Brand, Colour Palette) |
| Home | code/src/app/page.tsx, code/src/components/DebateCard.tsx, README.md |
| Debate detail | code/src/app/debate/[id]/page.tsx, code/src/components/ArgumentCard.tsx, code/src/data/seed.ts |
| Argument detail + Results | code/src/app/argument/[id]/page.tsx, code/src/app/results/[id]/page.tsx, code/src/components/VoteButtons.tsx, code/src/data/seed.ts |
