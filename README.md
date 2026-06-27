# TaskFlow - SaaS Task Management & Product Analytics MVP

TaskFlow is a full-stack SaaS task management MVP built as a portfolio project. It combines a Trello/Asana-style workspace with product analytics instrumentation, a Looker-style admin dashboard, optional Mixpanel forwarding, optional Hotjar browser tracking, and Vercel-ready deployment using Neon/PostgreSQL.

The goal of this project was not only to build CRUD screens, but also to practice how a SaaS product measures activation, pricing intent, subscription behavior, churn, and admin reporting.

## Links

| Item | URL |
| --- | --- |
| Repository | https://github.com/Heliacaa/TaskManagement |
| Live demo | https://task-management-eight-ebon.vercel.app/ |
| Admin route | `/admin/analytics` |

## Highlights

- Email/password authentication with signed HTTP-only cookie sessions
- User registration, login, logout, and password hashing with Node `crypto.scrypt`
- Project CRUD with ownership checks and a Free plan project limit
- Kanban-style project boards with Backlog, To do, In progress, and Done columns
- Task creation, deletion, priority, due dates, and status movement
- Mocked Premium subscription flow with upgrade and cancellation events
- Premium unlocks unlimited projects and dark mode
- Local event tracking for activation, pricing, upgrade, and churn behavior
- Admin analytics dashboard with active users, MRR, churn, funnel conversion, pricing attention, and recent events
- Optional server-side Mixpanel event forwarding
- Optional Hotjar or Contentsquare browser tag support for pricing-page behavior
- Local SQLite setup plus Vercel/Neon PostgreSQL production setup

## Why I Built It

I built this project to learn how product analytics and SaaS reporting fit into a real application flow. The product itself is a task manager, but the deeper focus is the analytics layer:

- What events should be tracked during onboarding?
- How can a funnel show activation from signup to project creation to task creation?
- How can pricing-page behavior be captured without a full analytics platform?
- How do subscription events affect MRR and churn reporting?
- How can a dashboard communicate product health to an admin user?

Looker is represented as a local Looker-style BI dashboard rather than a live Looker integration. Mixpanel and Hotjar are optional real integrations that can be enabled through environment variables.

## Product Walkthrough

### Authentication

Users can register and log in with email/password credentials. Passwords are hashed with `scrypt`, and sessions are stored as signed cookies.

### Workspace

After login, users land on a dashboard where they can create and delete projects. Free users are limited to 3 projects. Premium users can create unlimited projects.

### Kanban Board

Each project has a board with four task statuses:

- Backlog
- To do
- In progress
- Done

Tasks include title, optional description, priority, due date, and movement controls.

### Premium Flow

The Premium plan is intentionally mocked. There is no real billing provider. The upgrade and cancellation flows update the local subscription state and emit analytics events so MRR and churn can be demonstrated.

### Admin Analytics

Admins can open `/admin/analytics` to see:

- Active users from recent analytics activity
- Demo MRR from active Premium subscriptions
- Churn rate from canceled Premium subscriptions
- Signup activation funnel
- Pricing-page views, attention time, and upgrade clicks
- Recent product event stream
- Integration status for Mixpanel and Hotjar

## Analytics Story

TaskFlow records product events in the `AnalyticsEvent` table through Prisma. The app works without external analytics accounts, which keeps the project easy to run locally and easy to review from GitHub.

### Activation Funnel

The app tracks this funnel:

```text
signup_completed -> project_created -> task_created
```

The admin dashboard calculates user counts, conversion percentages, and drop-off for each step.

### Pricing Behavior

The pricing page tracks lightweight behavioral signals:

- `pricing_viewed`: the pricing page was opened
- `pricing_plan_focused`: a plan card was hovered or focused, including duration
- `upgrade_clicked`: the Premium CTA was clicked

These events power the pricing attention section in the admin dashboard. If Hotjar is configured, browser-side Hotjar events can also be sent.

### Subscription Metrics

The mocked subscription flow emits:

- `upgrade_clicked`
- `premium_started`
- `subscription_canceled`

These events support the demo SaaS reporting layer for MRR and churn.

### External Analytics

Mixpanel and Hotjar are optional. When the required environment variables are present:

- Server-side events are forwarded to Mixpanel.
- Hotjar or Contentsquare tracking can be injected into the browser.

When credentials are missing, the app still runs normally and stores analytics locally.

## Tech Stack

| Area | Tools |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React, Tailwind CSS, lucide-react |
| Database | Prisma, SQLite locally, PostgreSQL on Vercel/Neon |
| Auth | Custom email/password auth, signed cookies |
| Analytics | Local Prisma events, optional Mixpanel, optional Hotjar/Contentsquare |
| Testing | Vitest, TypeScript typecheck |
| Deployment | Vercel |

## Data Model

The core Prisma models are:

- `User`: account, password hash, admin flag
- `Project`: user-owned workspace/project
- `Task`: kanban item attached to a project
- `Subscription`: mocked Free/Premium subscription state
- `AnalyticsEvent`: product analytics event stream

## Local Setup

Install dependencies:

```bash
npm install
```

Create the local database schema:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
DATABASE_URL="file:./dev.db"
SESSION_SECRET="replace-this-with-a-long-random-string"
MIXPANEL_PROJECT_TOKEN=""
NEXT_PUBLIC_HOTJAR_SITE_ID=""
NEXT_PUBLIC_HOTJAR_VERSION="6"
NEXT_PUBLIC_CONTENTSQUARE_TAG_URL=""
```

Only `DATABASE_URL` is required locally. `SESSION_SECRET` should be set for deployed environments. Analytics values are optional.

Do not commit real `.env` secrets.

## Demo Accounts

After running `npm run db:seed`, these demo accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Admin + Premium | `admin@taskflow.dev` | `password123` |
| Free user | `free@taskflow.dev` | `password123` |
| Premium user | `premium@taskflow.dev` | `password123` |
| Churned user | `churned@taskflow.dev` | `password123` |

For a deployed production database, you can also register a new user from `/register`. To make a user an admin, update `isAdmin` to `true` in the database.

## Vercel Deployment

Vercel deployments should use hosted PostgreSQL. Do not deploy with the local SQLite URL (`file:./dev.db`).

Recommended production setup:

1. Create or connect a Neon/PostgreSQL database.
2. Add environment variables in Vercel Project Settings.
3. Make sure `DATABASE_URL` points to the hosted PostgreSQL database.
4. Add a strong `SESSION_SECRET`.
5. Redeploy the project.

Example Vercel environment variables:

```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="a-long-random-production-secret"
MIXPANEL_PROJECT_TOKEN=""
NEXT_PUBLIC_HOTJAR_SITE_ID=""
NEXT_PUBLIC_HOTJAR_VERSION="6"
NEXT_PUBLIC_CONTENTSQUARE_TAG_URL=""
```

The build script runs Prisma setup before `next build`. If `DATABASE_URL` is PostgreSQL, the PostgreSQL Prisma schema is used.

To create demo users in a disposable deployed database:

```bash
npm run db:seed
```

Warning: `npm run db:seed` deletes existing users, projects, tasks, subscriptions, and analytics events before creating demo data. Do not run it against a production database with real data.

## Real Analytics Setup

### Mixpanel

1. Create a Mixpanel project.
2. Copy the Project Token.
3. Add it to `.env` or Vercel environment variables:

```bash
MIXPANEL_PROJECT_TOKEN="your-project-token"
```

4. Trigger product events by registering, creating a project, creating a task, upgrading, or canceling Premium.
5. Verify events in Mixpanel Events or Live View.

### Hotjar

1. Create a Hotjar site/property.
2. Copy the Hotjar Site ID.
3. Add:

```bash
NEXT_PUBLIC_HOTJAR_SITE_ID="123456"
NEXT_PUBLIC_HOTJAR_VERSION="6"
```

4. Open `/pricing`, focus or hover pricing cards, and click the Premium CTA.
5. Verify tracking in Hotjar.

If Contentsquare onboarding provides a script URL instead:

```html
<script src="https://t.contentsquare.net/uxa/your-tag-id.js" defer></script>
```

Add only the URL:

```bash
NEXT_PUBLIC_CONTENTSQUARE_TAG_URL="https://t.contentsquare.net/uxa/your-tag-id.js"
```

After changing public analytics variables on Vercel, redeploy so the browser tag is included in the production build.

## Verification

Run tests:

```bash
npm run test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Run a production build:

```bash
npm run build
```

## Key Routes

| Route | Purpose |
| --- | --- |
| `/login` | Login |
| `/register` | Account creation |
| `/dashboard` | Project dashboard |
| `/projects/[id]` | Kanban project board |
| `/pricing` | Mock Premium plan and pricing analytics |
| `/admin/analytics` | Admin BI/product analytics dashboard |

## Portfolio Talking Points

- Built a full-stack SaaS MVP with Next.js App Router, TypeScript, Prisma, and Tailwind CSS.
- Implemented custom email/password authentication with signed cookies and hashed passwords.
- Designed a project/task workflow with plan limits and a mocked Premium subscription lifecycle.
- Instrumented product analytics events across signup, activation, pricing, upgrade, and churn flows.
- Built a Looker-style admin dashboard for active users, MRR, churn, funnel conversion, pricing attention, and event streams.
- Added optional Mixpanel and Hotjar/Contentsquare integrations through environment variables.
- Prepared the app for Vercel deployment with Neon/PostgreSQL in production and SQLite locally.

## Screenshots

Suggested screenshots for a portfolio README:

- Dashboard: `public/screenshots/dashboard.png`
- Kanban board: `public/screenshots/project-board.png`
- Pricing: `public/screenshots/pricing.png`
- Admin analytics: `public/screenshots/admin-analytics.png`

## Project Notes

This is an MVP built for learning and portfolio presentation. Billing is mocked, Looker is represented by an internal Looker-style reporting screen, and external analytics integrations are optional. The core product, local analytics event model, admin dashboard, and Vercel/PostgreSQL deployment path are implemented.
