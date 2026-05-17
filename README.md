# PropStream-Style Real Estate Deal Search Platform

## Overview
This repo now includes a Turborepo blueprint (`propstream-clone/`) for a PropStream-like platform with backend API, scoring engine, frontend, mobile outline, Docker, CI, Prisma/Postgres schema, and deployment playbooks.

## Monorepo Structure
```text
propstream-clone/
  apps/backend
  apps/frontend
  apps/mobile
  packages/shared-types
  packages/shared-config
  .github/workflows/ci.yml
  turbo.json
  docker-compose.yml
```

## Backend API
Endpoints: `GET /health`, `GET /states`, `GET /states/:code`, `POST /search`, `GET /properties/:id`, plus admin namespaces `/admin/states`, `/admin/properties`, `/admin/settings` (to be wired similarly).

## Scoring formulas
- `StrategyBase = 0.7 * Base + 0.3 * InvestmentProbability`
- `AdjustedScore = BaseScore * (1 - Risk/100) + InvestmentProbability * (Risk/100)`
- `RiskPenaltyFactor = 1 - (Risk/100) * ((100 - InvestmentProbability)/100)`
- `FinalAdjustedInvestmentScore = InvestmentProbability * RiskPenaltyFactor`

## State criteria and types
- Includes hard-coded state criteria scaffolding in backend data layer; production should move to seeded DB records (see `prisma/seed.ts` todo).
- Includes residential/commercial types and occupancy flag taxonomy in API contracts.

## Prisma + SQL
- Prisma models provided for `State`, `StateCriteria`, `Property`, `OccupancyFlag`, `PropertyScore`.
- SQL equivalent can be generated with Prisma migrations.

## Frontend / mobile / dashboard
- Next.js App Router component plan: `SearchForm`, `RiskSlider`, `PropertyCard`, `ScoresPanel`, `ScoreBar`.
- Mobile Expo screen plan: `SearchScreen`, `ResultsScreen`, `DetailScreen` with live risk override recalculation.

## Docker
- Compose: postgres + backend + frontend.
- Backend Dockerfile: Node 20 Alpine + Prisma generate + TS build.
- Frontend Dockerfile: Node 20 Alpine build + Nginx serve.

## CI/CD
- GitHub Actions workflow scaffold requested at `.github/workflows/ci.yml`.

## 10-command quickstart
1. `git clone https://github.com/your-org/propstream-clone.git`
2. `cd propstream-clone`
3. `cp apps/backend/.env.example apps/backend/.env`
4. `docker-compose up -d db`
5. `cd apps/backend && npm install`
6. `npx prisma migrate dev --name init`
7. `npx prisma db seed`
8. `npm run dev`
9. `cd ../frontend && npm install && npm run dev`
10. Open `http://localhost:3000`

## Architecture Diagram
```text
[Web Next.js]    [Mobile Expo]
       \            /
        \          /
        [API Gateway: Express Routes]
           |  /states /search /properties /admin/*
           v
  [Service Layer]
  - CriteriaService
  - PropertyService
  - ScoringService
  - MarketDataService
           v
  [Data Layer]
  Prisma Client -> PostgreSQL
   tables: states, state_criteria, properties, occupancy_flags, property_scores
           v
 [Infra]
 Docker Compose | Render | Fly.io | AWS ECS/RDS | Vercel | GitHub Actions CI/CD
```

## Conventional Commit Sequence
- feat: bootstrap turborepo with backend and frontend apps
- feat(backend): add Prisma schema and PostgreSQL models
- feat(backend): implement state criteria and property services
- feat(backend): add scoringService with risk slider logic
- test(backend): add scoring test suite for strategies and risk
- feat(frontend): add Next.js search UI and scoring dashboard
- feat(frontend): add admin panel for state criteria
- feat(mobile): scaffold React Native app with search + results
- chore: add Dockerfiles and docker-compose for local dev
- ci: configure GitHub Actions for build and docker push
- docs: update README with setup, API reference, and deployment
- feat(seed): add Prisma seed script for all 50 states
