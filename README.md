# opensourcemanan

Manan Shah's all-in-one personal site — portfolio, blog, and whatever comes
next — deployed to Vercel, built entirely in the open. Live at
[opensourcemanan.vercel.app](https://opensourcemanan.vercel.app).

The centerpiece is **Sully**: paste a job description into the portfolio and a
real, streaming [LangGraph.js](https://langchain-ai.github.io/langgraphjs/)
agent assesses the fit against Manan's actual work — live, node by node, never
pre-scripted.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript · Drizzle ORM on
CockroachDB · Google Cloud Storage · NextAuth v5 (Google) · Vercel.

**This Next.js diverges from training-data assumptions** — see
[`AGENTS.md`](./AGENTS.md) before writing Next.js code here.

## Contributing

[`agent-kit/`](./agent-kit/) is the single source of truth for how this repo
is built — conventions, architecture, and the commit/PR workflow — for humans
and agents alike. Start with [`agent-kit/README.md`](./agent-kit/README.md).
[`docs/architecture.md`](./docs/architecture.md) has the human-readable
overview, and [`docs/decisions/`](./docs/decisions/) records the "why" behind
notable choices as they're made.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, auth, storage, etc.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts (see `agent-kit/database.md` and `agent-kit/storage.md` for the
one-time cloud setup these assume):

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run build          # next build
npm run db:generate    # diff db/schema/* → a new migration
npm run db:migrate     # apply pending migrations
npm run db:studio      # browse the DB
```

## Deploying

Vercel's GitHub integration handles it — see
[`docs/architecture.md`](./docs/architecture.md#deploying-to-vercel-one-time-setup)
for the one-time import steps. `main` is protected and always deployed; every
change flows branch → PR → green CI → merge.
