# TaskFlow SaaS MVP

TaskFlow is a portfolio-ready SaaS task manager inspired by Trello and Asana. It includes authentication, projects, kanban tasks, a mocked Premium plan, a local analytics dashboard, and optional real Mixpanel + Hotjar integrations.

## Features

- Email/password registration and login with signed cookie sessions
- Project CRUD with a Free plan limit of 3 projects
- Kanban task board with Backlog, To do, In progress, and Done columns
- Mock Premium upgrade and cancellation flow
- Premium unlocks unlimited projects and dark mode
- Local analytics events for signup, activation, pricing attention, upgrades, and churn
- Optional Mixpanel event forwarding and Hotjar browser tracking through environment variables
- Admin dashboard with active users, MRR, churn, funnel conversion, pricing attention, and recent events
- Seeded SQLite demo data for a useful first run

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## Local Setup

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The app runs without external analytics credentials. To enable real Mixpanel and Hotjar tracking, copy `.env.example` to `.env`, fill the analytics values, and restart the dev server.

## Vercel Deployment

Do not deploy this app with the local SQLite URL (`file:./dev.db`). Vercel deployments need a hosted database because local SQLite files are not a reliable persistent runtime database in serverless deployments.

1. Create a hosted PostgreSQL database.
2. Add these variables in Vercel Project Settings -> Environment Variables:

```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="a-long-random-production-secret"
MIXPANEL_PROJECT_TOKEN=""
NEXT_PUBLIC_HOTJAR_SITE_ID=""
NEXT_PUBLIC_HOTJAR_VERSION="6"
NEXT_PUBLIC_CONTENTSQUARE_TAG_URL=""
```

3. Redeploy. The build script runs `prisma db push` when `DATABASE_URL` is PostgreSQL, so the production tables are prepared before `next build`.
4. Register a new user on the deployed app, or seed demo accounts only for a disposable demo database. To seed the deployed database, run this with the production PostgreSQL `DATABASE_URL` loaded in your shell instead of the local SQLite URL:

```bash
npm run db:seed
```

`npm run db:seed` deletes existing users, projects, tasks, subscriptions, and analytics events before creating demo data.

If Vercel shows an `Application error` with a digest after login, open the Vercel deployment logs and look for the matching digest. The usual causes are a missing `DATABASE_URL`, using the local SQLite URL in production, or deploying before the database schema exists.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin + Premium | `admin@taskflow.dev` | `password123` |
| Free user | `free@taskflow.dev` | `password123` |
| Premium user | `premium@taskflow.dev` | `password123` |
| Churned user | `churned@taskflow.dev` | `password123` |

## Product Analytics Story

This project works out of the box with local SQLite analytics. When credentials are configured, the same product events are also forwarded to real Mixpanel and Hotjar accounts so the integration can be verified outside the app.

### Looker-style executive reporting

The `/admin/analytics` page acts like a SaaS BI dashboard:

- Active users: unique users with analytics activity in the last 30 days
- MRR: active Premium subscriptions multiplied by the demo monthly price
- Churn rate: canceled Premium subscriptions divided by active plus canceled Premium subscriptions
- Recent event stream: latest product and subscription events

These metrics are calculated in `lib/metrics.ts` from SQLite data created through Prisma.

### Mixpanel funnel analytics

The app instruments an activation funnel:

```text
signup_completed -> project_created -> task_created
```

Events are recorded when a user registers, creates a project, and creates a task. The admin dashboard shows user counts, conversion percentages, and drop-off between each funnel step. If `MIXPANEL_PROJECT_TOKEN` is configured, the same server-side events are also sent to Mixpanel with privacy-safe user IDs and plan metadata.

### Hotjar pricing behavior analysis

The pricing page tracks behavioral signals similar to a lightweight heatmap/session analytics workflow:

- `pricing_viewed`: pricing page opened
- `pricing_plan_focused`: Free or Premium plan card hovered/focused, including duration in milliseconds
- `upgrade_clicked`: Premium CTA clicked

The client-side tracker in `components/PricingTracker.tsx` sends pricing interactions to `/api/analytics`, and `/admin/analytics` summarizes attention time and clicks per plan. If `NEXT_PUBLIC_HOTJAR_SITE_ID` is configured, the same pricing interactions are also sent to Hotjar through the browser SDK.

### Event tracking model

All product analytics events are stored in the `AnalyticsEvent` table:

- `signup_completed`
- `project_created`
- `task_created`
- `pricing_viewed`
- `pricing_plan_focused`
- `upgrade_clicked`
- `premium_started`
- `subscription_canceled`

This keeps the MVP self-contained while demonstrating event instrumentation, funnel analysis, subscription metrics, and pricing-page behavior analysis.

## Real Analytics Setup

### Mixpanel

1. Create a Mixpanel account and a new project.
2. Open Project Settings and copy the Project Token.
3. Add it to `.env`:

```bash
MIXPANEL_PROJECT_TOKEN="your-project-token"
```

4. Restart the app, register a new user, create a project, create a task, and upgrade/cancel Premium.
5. Verify events such as `signup_completed`, `project_created`, `task_created`, `upgrade_clicked`, `premium_started`, and `subscription_canceled` in Mixpanel Events or Live View.

### Hotjar

1. Create a Hotjar account and add a site/property.
2. Copy the Hotjar Site ID.
3. Add it to `.env`:

```bash
NEXT_PUBLIC_HOTJAR_SITE_ID="123456"
NEXT_PUBLIC_HOTJAR_VERSION="6"
```

4. Restart the app, open `/pricing`, hover or focus both plan cards, and click the Premium CTA.
5. Verify Hotjar tracking status, events, and sessions. A deployed URL is more reliable than localhost for session recording evidence.

If the new Contentsquare onboarding gives you a tag like this instead:

```html
<script src="https://t.contentsquare.net/uxa/your-tag-id.js" defer></script>
```

Add only the script URL to your environment:

```bash
NEXT_PUBLIC_CONTENTSQUARE_TAG_URL="https://t.contentsquare.net/uxa/your-tag-id.js"
```

After changing this value on Vercel, redeploy the production deployment so the browser tag is included in the live app.

Do not commit real `.env` values. The repository includes `.env.example` only.

## Verification

```bash
npm run test
npm run typecheck
npm run build
```

## Resume Talking Points

- Built a full-stack SaaS task management MVP with Next.js, TypeScript, Prisma, SQLite, and Tailwind CSS.
- Implemented local product analytics instrumentation with optional real Mixpanel event forwarding.
- Built an admin BI dashboard modeled after Looker to report active users, MRR, churn, funnel conversion, and event streams.
- Added Hotjar browser tracking for pricing-page attention signals and Premium CTA clicks.
- Designed a mocked Premium subscription flow with project limits, upgrade/cancel events, and seeded demo data.

## Key Routes

- `/login`
- `/register`
- `/dashboard`
- `/projects/[id]`
- `/pricing`
- `/admin/analytics`

## Screenshots

Add screenshots after running locally:

- Dashboard: `public/screenshots/dashboard.png`
- Kanban board: `public/screenshots/project-board.png`
- Pricing: `public/screenshots/pricing.png`
- Admin analytics: `public/screenshots/admin-analytics.png`

## Notes

This MVP intentionally mocks billing and keeps the Looker-style BI dashboard local. Mixpanel and Hotjar are optional real integrations controlled by environment variables, so reviewers can run the app from GitHub without external accounts or verify live analytics when credentials are configured.
