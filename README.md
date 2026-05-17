# RealEstateDealSearch

## 1) Product Scope (PropStream-Style)

A web app for finding and evaluating U.S. real estate deals with:
- Property search by **state, mode (residential/commercial), property type, occupancy type, and strategy flags**.
- Per-property and per-state scoring (0–100) for:
  - Preforeclosure Opportunity
  - Lease-Option Viability
  - Owner-Financing Feasibility
  - Overall Investor-Friendliness
- Deterministic tags explaining *why* a score was produced.

---

## 2) Core Features

### Search & Discovery
- Filter panel:
  - State
  - Mode: Residential / Commercial
  - Property Type
  - Occupancy Type
  - Strategy flags: preforeclosure / lease-option / owner-financing
- Ranked results list (sortable by any score, equity, price, distress).
- Map + list views.

### Scoring & Explainability
- State-level legal/market criteria are hard-coded reference tables.
- Strategy score breakdown and explanation tags:
  - Example: `Judicial foreclosure`, `Long redemption`, `Tenant-friendly`

### Workflow
- Save searches
- Export leads (CSV)
- Favorite properties
- View strategy recommendations by state

---

## 3) Enumerations (Developer Constants)

```ts
export type SearchMode = 'RESIDENTIAL' | 'COMMERCIAL';

export type ResidentialPropertyType =
  | 'SFR'
  | 'DUPLEX'
  | 'TRIPLEX'
  | 'FOURPLEX'
  | 'SMALL_MULTIFAMILY_5_19'
  | 'LARGE_MULTIFAMILY_20_PLUS'
  | 'TOWNHOUSE'
  | 'CONDO'
  | 'MANUFACTURED_HOME'
  | 'MOBILE_HOME'
  | 'MODULAR_HOME'
  | 'MIXED_USE_RESIDENTIAL'
  | 'VACANT_RESIDENTIAL_LAND';

export type CommercialPropertyType =
  | 'RETAIL'
  | 'OFFICE'
  | 'INDUSTRIAL'
  | 'WAREHOUSE'
  | 'FLEX_SPACE'
  | 'HOSPITALITY'
  | 'MEDICAL_OFFICE'
  | 'SELF_STORAGE'
  | 'GAS_STATION'
  | 'CAR_WASH'
  | 'RESTAURANT'
  | 'SHOPPING_CENTER'
  | 'COMMERCIAL_LAND'
  | 'SPECIAL_PURPOSE_COMMERCIAL';

export type OccupancyType =
  | 'OWNER_OCCUPIED'
  | 'TENANT_OCCUPIED'
  | 'VACANT'
  | 'ABSENTEE_OWNER'
  | 'CORPORATE_OWNED'
  | 'GOVERNMENT_OWNED'
  | 'BANK_OWNED_REO'
  | 'PREFORECLOSURE'
  | 'AUCTION'
  | 'PROBATE'
  | 'TAX_DELINQUENT'
  | 'CODE_VIOLATION'
  | 'LIENS'
  | 'HIGH_EQUITY'
  | 'LOW_EQUITY'
  | 'FREE_AND_CLEAR';

export type InvestmentStrategy =
  | 'PREFORECLOSURE'
  | 'LEASE_OPTION'
  | 'OWNER_FINANCING';
```

---

## 4) Data Models

```ts
export interface Property {
  id: string;
  apn?: string;
  address: {
    line1: string;
    city: string;
    county: string;
    stateCode: string; // e.g., FL
    zip: string;
    lat?: number;
    lng?: number;
  };
  mode: SearchMode;
  propertyType: ResidentialPropertyType | CommercialPropertyType;
  occupancyType: OccupancyType;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSqft?: number;
  units?: number;
  yearBuilt?: number;
  listPrice?: number;
  estimatedValue?: number;
  equityPct?: number;
  distressFlags: {
    preforeclosure?: boolean;
    auction?: boolean;
    reo?: boolean;
    taxDelinquent?: boolean;
    liens?: boolean;
    probate?: boolean;
    codeViolation?: boolean;
  };
  owner: {
    absentee?: boolean;
    corporateOwned?: boolean;
    governmentOwned?: boolean;
    freeAndClear?: boolean;
  };
  market: {
    countyDistressRate?: number; // 0..1
    medianDom?: number;
    yoyPriceChangePct?: number;
    rentToPriceRatio?: number;
  };
  updatedAt: string;
}

export interface StateCriteria {
  stateCode: string;
  foreclosureType: 'JUDICIAL' | 'NON_JUDICIAL' | 'HYBRID';
  leaseOptionCategory: 'FRIENDLY' | 'NEUTRAL' | 'RESTRICTIVE';
  ownerFinancingCategory: 'MINIMAL' | 'MODERATE' | 'STRICT';
  redemptionCategory: 'NONE' | 'SHORT' | 'LONG';
  homesteadProtection: 'STRONG' | 'MODERATE' | 'WEAK';
  landlordTenantCategory: 'LANDLORD_FRIENDLY' | 'BALANCED' | 'TENANT_FRIENDLY';
}

export interface SearchFilters {
  states: string[];
  mode: SearchMode;
  propertyTypes: (ResidentialPropertyType | CommercialPropertyType)[];
  occupancyTypes: OccupancyType[];
  strategies: InvestmentStrategy[];
  minScore?: number;
  sortBy?: 'SCORE' | 'PRICE' | 'EQUITY' | 'DISTRESS';
  page?: number;
  pageSize?: number;
}

export interface StrategyScores {
  stateCode: string;
  preforeclosureScore: number;     // 0..100
  leaseOptionScore: number;        // 0..100
  ownerFinancingScore: number;     // 0..100
  overallInvestorScore: number;    // 0..100
  tags: string[];
  recommendedStrategies: string[];
}
```

---

## 5) Hard-Coded State Criteria Reference Data

> Rule handling:
> - If a state is in Neutral and Restrictive for lease-option, use **Restrictive**.
> - If a state is in Moderate and Strict for owner-financing, use **Strict**.
> - If redemption could overlap, use the **longest** redemption for risk scoring.

```ts
// src/reference/stateCriteria.ts
const FORECLOSURE_TYPE: Record<string, 'JUDICIAL'|'NON_JUDICIAL'|'HYBRID'> = {
  AL:'JUDICIAL', CT:'JUDICIAL', DE:'JUDICIAL', FL:'JUDICIAL', HI:'JUDICIAL', IL:'JUDICIAL', IN:'JUDICIAL', IA:'JUDICIAL', KS:'JUDICIAL', KY:'JUDICIAL',
  LA:'JUDICIAL', ME:'JUDICIAL', NE:'JUDICIAL', NJ:'JUDICIAL', NM:'JUDICIAL', NY:'JUDICIAL', ND:'JUDICIAL', OH:'JUDICIAL', OK:'JUDICIAL', PA:'JUDICIAL',
  SC:'JUDICIAL', VT:'JUDICIAL', WI:'JUDICIAL',
  AK:'NON_JUDICIAL', AZ:'NON_JUDICIAL', CA:'NON_JUDICIAL', CO:'NON_JUDICIAL', GA:'NON_JUDICIAL', ID:'NON_JUDICIAL', MD:'NON_JUDICIAL', MI:'NON_JUDICIAL',
  MN:'NON_JUDICIAL', MS:'NON_JUDICIAL', MO:'NON_JUDICIAL', MT:'NON_JUDICIAL', NV:'NON_JUDICIAL', NH:'NON_JUDICIAL', NC:'NON_JUDICIAL', OR:'NON_JUDICIAL',
  RI:'NON_JUDICIAL', SD:'NON_JUDICIAL', TN:'NON_JUDICIAL', TX:'NON_JUDICIAL', UT:'NON_JUDICIAL', VA:'NON_JUDICIAL', WA:'NON_JUDICIAL', WY:'NON_JUDICIAL',
  AR:'HYBRID', MA:'HYBRID', WV:'HYBRID'
};

const LEASE_OPTION: Record<string, 'FRIENDLY'|'NEUTRAL'|'RESTRICTIVE'> = {
  AL:'FRIENDLY', AZ:'FRIENDLY', AR:'FRIENDLY', CO:'FRIENDLY', FL:'FRIENDLY', GA:'FRIENDLY', ID:'FRIENDLY', IN:'FRIENDLY', IA:'FRIENDLY', KS:'FRIENDLY',
  KY:'FRIENDLY', MO:'FRIENDLY', MT:'FRIENDLY', NE:'FRIENDLY', NV:'FRIENDLY', NM:'FRIENDLY', NC:'FRIENDLY', OH:'FRIENDLY', OK:'FRIENDLY', SC:'FRIENDLY',
  TN:'FRIENDLY', UT:'FRIENDLY', VA:'FRIENDLY', WV:'FRIENDLY', WY:'FRIENDLY',
  AK:'NEUTRAL', CA:'NEUTRAL', CT:'NEUTRAL', DE:'NEUTRAL', HI:'NEUTRAL', IL:'NEUTRAL', LA:'NEUTRAL', ME:'NEUTRAL', MA:'NEUTRAL', MI:'NEUTRAL',
  MS:'NEUTRAL', NH:'NEUTRAL', NJ:'NEUTRAL', NY:'NEUTRAL', ND:'NEUTRAL', OR:'NEUTRAL', PA:'NEUTRAL', RI:'NEUTRAL', SD:'NEUTRAL', VT:'NEUTRAL', WA:'NEUTRAL',
  TX:'RESTRICTIVE', WI:'RESTRICTIVE', MN:'RESTRICTIVE', MD:'RESTRICTIVE'
};

const OWNER_FINANCING: Record<string, 'MINIMAL'|'MODERATE'|'STRICT'> = {
  AL:'MINIMAL', AK:'MINIMAL', AZ:'MINIMAL', AR:'MINIMAL', CO:'MINIMAL', FL:'MINIMAL', GA:'MINIMAL', ID:'MINIMAL', IN:'MINIMAL', IA:'MINIMAL', KS:'MINIMAL',
  KY:'MINIMAL', MO:'MINIMAL', MT:'MINIMAL', NE:'MINIMAL', NV:'MINIMAL', NM:'MINIMAL', NC:'MINIMAL', OH:'MINIMAL', OK:'MINIMAL', SC:'MINIMAL', TN:'MINIMAL',
  UT:'MINIMAL', VA:'MINIMAL', WV:'MINIMAL', WY:'MINIMAL',
  CT:'MODERATE', DE:'MODERATE', HI:'MODERATE', IL:'MODERATE', LA:'MODERATE', ME:'MODERATE', MA:'MODERATE', MI:'MODERATE', MN:'MODERATE', MS:'MODERATE',
  NH:'MODERATE', ND:'MODERATE', OR:'MODERATE', PA:'MODERATE', RI:'MODERATE', SD:'MODERATE', VT:'MODERATE', WA:'MODERATE', WI:'MODERATE',
  CA:'STRICT', MD:'STRICT', NY:'STRICT', NJ:'STRICT', TX:'STRICT'
};

const REDEMPTION: Record<string, 'NONE'|'SHORT'|'LONG'> = {
  AK:'NONE', AZ:'NONE', CA:'NONE', GA:'NONE', ID:'NONE', MO:'NONE', NV:'NONE', NH:'NONE', NC:'NONE', OR:'NONE', TX:'NONE', VA:'NONE', WA:'NONE', WY:'NONE',
  AL:'SHORT', AR:'SHORT', CO:'SHORT', FL:'SHORT', HI:'SHORT', IN:'SHORT', IA:'SHORT', KS:'SHORT', KY:'SHORT', LA:'SHORT', MD:'SHORT', MI:'SHORT',
  MS:'SHORT', MT:'SHORT', NE:'SHORT', NM:'SHORT', ND:'SHORT', OK:'SHORT', SC:'SHORT', SD:'SHORT', TN:'SHORT', UT:'SHORT', WV:'SHORT',
  IL:'LONG', OH:'LONG', PA:'LONG', WI:'LONG', NJ:'LONG', NY:'LONG', ME:'LONG', VT:'LONG', RI:'LONG', MA:'LONG',
  MN:'LONG' // prioritized as longest risk category due to mixed applicability
};

const HOMESTEAD: Record<string, 'STRONG'|'MODERATE'|'WEAK'> = {
  FL:'STRONG', TX:'STRONG', KS:'STRONG', IA:'STRONG', SD:'STRONG', OK:'STRONG',
  AK:'MODERATE', AZ:'MODERATE', AR:'MODERATE', CA:'MODERATE', CO:'MODERATE', HI:'MODERATE', ID:'MODERATE', IL:'MODERATE', LA:'MODERATE', ME:'MODERATE',
  MA:'MODERATE', MN:'MODERATE', MS:'MODERATE', MT:'MODERATE', NV:'MODERATE', NH:'MODERATE', NM:'MODERATE', NC:'MODERATE', ND:'MODERATE', OR:'MODERATE',
  RI:'MODERATE', SC:'MODERATE', TN:'MODERATE', UT:'MODERATE', VT:'MODERATE', WA:'MODERATE', WI:'MODERATE', WY:'MODERATE',
  AL:'WEAK', CT:'WEAK', DE:'WEAK', GA:'WEAK', IN:'WEAK', KY:'WEAK', MD:'WEAK', MI:'WEAK', MO:'WEAK', NE:'WEAK', NJ:'WEAK', NY:'WEAK', OH:'WEAK',
  PA:'WEAK', VA:'WEAK', WV:'WEAK'
};

const LANDLORD_TENANT: Record<string, 'LANDLORD_FRIENDLY'|'BALANCED'|'TENANT_FRIENDLY'> = {
  AL:'LANDLORD_FRIENDLY', AZ:'LANDLORD_FRIENDLY', AR:'LANDLORD_FRIENDLY', CO:'LANDLORD_FRIENDLY', FL:'LANDLORD_FRIENDLY', GA:'LANDLORD_FRIENDLY',
  ID:'LANDLORD_FRIENDLY', IN:'LANDLORD_FRIENDLY', IA:'LANDLORD_FRIENDLY', KS:'LANDLORD_FRIENDLY', KY:'LANDLORD_FRIENDLY', MS:'LANDLORD_FRIENDLY',
  MO:'LANDLORD_FRIENDLY', MT:'LANDLORD_FRIENDLY', NE:'LANDLORD_FRIENDLY', NV:'LANDLORD_FRIENDLY', NC:'LANDLORD_FRIENDLY', OH:'LANDLORD_FRIENDLY',
  OK:'LANDLORD_FRIENDLY', SC:'LANDLORD_FRIENDLY', SD:'LANDLORD_FRIENDLY', TN:'LANDLORD_FRIENDLY', TX:'LANDLORD_FRIENDLY', UT:'LANDLORD_FRIENDLY',
  VA:'LANDLORD_FRIENDLY', WV:'LANDLORD_FRIENDLY', WY:'LANDLORD_FRIENDLY',
  AK:'BALANCED', DE:'BALANCED', IL:'BALANCED', LA:'BALANCED', MI:'BALANCED', NH:'BALANCED', NM:'BALANCED', ND:'BALANCED', PA:'BALANCED', RI:'BALANCED', WI:'BALANCED',
  CA:'TENANT_FRIENDLY', CT:'TENANT_FRIENDLY', HI:'TENANT_FRIENDLY', ME:'TENANT_FRIENDLY', MD:'TENANT_FRIENDLY', MA:'TENANT_FRIENDLY', MN:'TENANT_FRIENDLY',
  NJ:'TENANT_FRIENDLY', NY:'TENANT_FRIENDLY', OR:'TENANT_FRIENDLY', VT:'TENANT_FRIENDLY', WA:'TENANT_FRIENDLY'
};
```

---

## 6) Deterministic Scoring Logic (0–100)

### Weight Design

Base criterion points:

- Foreclosure type: Non-judicial `+20`, Hybrid `+12`, Judicial `+5`
- Lease-option category: Friendly `+25`, Neutral `+14`, Restrictive `+4`
- Owner-financing: Minimal `+25`, Moderate `+14`, Strict `+3`
- Redemption: None `+20`, Short `+12`, Long `+3`
- Homestead: Weak `+12`, Moderate `+8`, Strong `+3`
- Landlord-tenant: Landlord-friendly `+18`, Balanced `+11`, Tenant-friendly `+4`

Property/occupancy modifiers (additive):
- Occupancy = PREFORECLOSURE: `+15` to preforeclosure score
- Occupancy = VACANT: `+8` to preforeclosure, `+6` lease-option, `+6` owner-financing
- Occupancy = TENANT_OCCUPIED: `-4` preforeclosure, `+4` lease-option
- Occupancy = OWNER_OCCUPIED: `+4` lease-option, `+6` owner-financing
- Distress flags (taxDelinquent/liens/codeViolation): each `+3` preforeclosure (cap +9)
- High equity: `+8` owner-financing, `+5` lease-option
- Free & clear: `+10` owner-financing

Mode/type modifiers:
- Residential mode: no penalty
- Commercial mode: `-5` lease-option (less common), `+3` owner-financing (seller paper often negotiable)

Market distress modifier (optional):
- `distressBoost = clamp(round(countyDistressRate * 20), 0, 12)`
  - Applied to preforeclosure only.

### TypeScript Implementation

```ts
function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function scoreStateStrategies(
  criteria: StateCriteria,
  property?: Property
): StrategyScores {
  const tags: string[] = [];

  const foreclosurePts = { NON_JUDICIAL: 20, HYBRID: 12, JUDICIAL: 5 }[criteria.foreclosureType];
  const leasePts = { FRIENDLY: 25, NEUTRAL: 14, RESTRICTIVE: 4 }[criteria.leaseOptionCategory];
  const ownerPts = { MINIMAL: 25, MODERATE: 14, STRICT: 3 }[criteria.ownerFinancingCategory];
  const redemptionPts = { NONE: 20, SHORT: 12, LONG: 3 }[criteria.redemptionCategory];
  const homesteadPts = { WEAK: 12, MODERATE: 8, STRONG: 3 }[criteria.homesteadProtection];
  const ltPts = { LANDLORD_FRIENDLY: 18, BALANCED: 11, TENANT_FRIENDLY: 4 }[criteria.landlordTenantCategory];

  tags.push(`${criteria.foreclosureType} foreclosure`);
  tags.push(`${criteria.redemptionCategory} redemption`);
  tags.push(`${criteria.landlordTenantCategory}`);

  // Base scores (state-only)
  let pre = foreclosurePts + redemptionPts + homesteadPts + ltPts;      // max ~70
  let lease = leasePts + ltPts + homesteadPts;                           // max ~55
  let owner = ownerPts + homesteadPts + ltPts;                           // max ~55

  if (property) {
    // Occupancy
    switch (property.occupancyType) {
      case 'PREFORECLOSURE': pre += 15; tags.push('occupancy:preforeclosure'); break;
      case 'VACANT': pre += 8; lease += 6; owner += 6; tags.push('occupancy:vacant'); break;
      case 'TENANT_OCCUPIED': pre -= 4; lease += 4; tags.push('occupancy:tenant'); break;
      case 'OWNER_OCCUPIED': lease += 4; owner += 6; tags.push('occupancy:owner'); break;
    }

    // Distress flags
    const distressCount = [
      property.distressFlags.taxDelinquent,
      property.distressFlags.liens,
      property.distressFlags.codeViolation
    ].filter(Boolean).length;
    pre += Math.min(9, distressCount * 3);

    // Equity proxy (if occupancy/flag implies)
    if (property.occupancyType === 'HIGH_EQUITY' || (property.equityPct ?? 0) >= 50) {
      owner += 8; lease += 5; tags.push('high-equity');
    }
    if (property.owner.freeAndClear || property.occupancyType === 'FREE_AND_CLEAR') {
      owner += 10; tags.push('free-and-clear');
    }

    // Mode/type modifier
    if (property.mode === 'COMMERCIAL') {
      lease -= 5;
      owner += 3;
      tags.push('commercial-adjustment');
    }

    // Market distress
    const distressRate = property.market.countyDistressRate ?? 0;
    const distressBoost = clamp(Math.round(distressRate * 20), 0, 12);
    pre += distressBoost;
    if (distressBoost > 0) tags.push(`market-distress:+${distressBoost}`);
  }

  pre = clamp(pre);
  lease = clamp(lease);
  owner = clamp(owner);

  const overall = clamp(Math.round(pre * 0.35 + lease * 0.30 + owner * 0.35));

  const recommendedStrategies: string[] = [];
  if (pre >= 70) recommendedStrategies.push('wholesaling', 'novations', 'sub-to');
  if (lease >= 70) recommendedStrategies.push('lease-option');
  if (owner >= 70) recommendedStrategies.push('seller-finance', 'wraps');
  if (recommendedStrategies.length === 0) recommendedStrategies.push('buy-and-hold', 'light value-add');

  return {
    stateCode: criteria.stateCode,
    preforeclosureScore: pre,
    leaseOptionScore: lease,
    ownerFinancingScore: owner,
    overallInvestorScore: overall,
    tags,
    recommendedStrategies: [...new Set(recommendedStrategies)]
  };
}
```

---

## 7) Filtering Logic

```ts
function filterProperties(properties: Property[], filters: SearchFilters): Property[] {
  return properties.filter((p) => {
    if (filters.states.length && !filters.states.includes(p.address.stateCode)) return false;
    if (filters.mode && p.mode !== filters.mode) return false;
    if (filters.propertyTypes.length && !filters.propertyTypes.includes(p.propertyType)) return false;
    if (filters.occupancyTypes.length && !filters.occupancyTypes.includes(p.occupancyType)) return false;

    if (filters.strategies.length) {
      const strategyMatch = filters.strategies.some((s) => {
        if (s === 'PREFORECLOSURE') return p.distressFlags.preforeclosure || p.occupancyType === 'PREFORECLOSURE';
        if (s === 'LEASE_OPTION') return p.occupancyType === 'VACANT' || p.occupancyType === 'OWNER_OCCUPIED' || p.owner.absentee;
        if (s === 'OWNER_FINANCING') return p.owner.freeAndClear || (p.equityPct ?? 0) >= 40;
        return false;
      });
      if (!strategyMatch) return false;
    }

    return true;
  });
}

function rankProperties(properties: Property[], stateCriteriaByCode: Record<string, StateCriteria>) {
  return properties
    .map((p) => ({
      property: p,
      scores: scoreStateStrategies(stateCriteriaByCode[p.address.stateCode], p)
    }))
    .sort((a, b) => b.scores.overallInvestorScore - a.scores.overallInvestorScore);
}
```

---

## 8) API Outline

### `POST /searchProperties`
**Request**
```json
{
  "filters": {
    "states": ["FL"],
    "mode": "RESIDENTIAL",
    "propertyTypes": ["SFR"],
    "occupancyTypes": ["VACANT"],
    "strategies": ["PREFORECLOSURE"],
    "minScore": 60,
    "page": 1,
    "pageSize": 25
  }
}
```

**Response**
```json
{
  "filtersApplied": { "state": ["FL"], "mode": "RESIDENTIAL", "propertyTypes": ["SFR"], "occupancyTypes": ["VACANT"], "strategies": ["PREFORECLOSURE"] },
  "results": [
    {
      "propertyId": "prop_123",
      "address": "101 Main St, Tampa, FL",
      "scores": {
        "preforeclosureScore": 78,
        "leaseOptionScore": 66,
        "ownerFinancingScore": 63,
        "overallInvestorScore": 69
      },
      "explanationTags": ["JUDICIAL foreclosure", "SHORT redemption", "LANDLORD_FRIENDLY", "occupancy:vacant"],
      "recommendedStrategies": ["wholesaling", "sub-to"]
    }
  ],
  "total": 1
}
```

### `GET /scoreStateStrategies?state=TX`
Returns baseline strategy scores and tags for the state plus recommendations.

### `GET /getStateCriteria?state=TX`
Returns the exact hard-coded criteria row used for scoring.

### `GET /getFilters`
Returns supported filter values for UI dropdowns (modes, types, occupancy, strategies, states).

---

## 9) High-Level Architecture

- **Frontend**: Next.js + TypeScript + Tailwind + Mapbox/Google Maps.
- **API Gateway**: REST endpoints + auth/rate limiting.
- **Search Service**: Handles filter query, faceting, pagination.
- **Scoring Engine**: Pure deterministic service/module for 0–100 scores.
- **State Criteria Reference Layer**: Versioned, hard-coded JSON/TS data loaded in memory.
- **Property Data Service**: Ingestion + normalization from external sources.
- **Datastores**:
  - PostgreSQL (system of record)
  - OpenSearch/Elasticsearch (fast filtered search)
  - Redis (cache hot filters/scores)

---

## 10) Data Sources (Practical)

- County assessor/tax records
- Recorder/foreclosure filings
- MLS/licensed feeds (if available)
- Parcel boundary/geospatial providers
- Demographic/economic overlays

> Use data licensing review early; county-level rights vary by state and provider.

---

## 11) Optional Relational Schema

```sql
CREATE TABLE states_criteria (
  state_code CHAR(2) PRIMARY KEY,
  foreclosure_type VARCHAR(20) NOT NULL,
  lease_option_category VARCHAR(20) NOT NULL,
  owner_financing_category VARCHAR(20) NOT NULL,
  redemption_category VARCHAR(10) NOT NULL,
  homestead_protection VARCHAR(10) NOT NULL,
  landlord_tenant_category VARCHAR(25) NOT NULL,
  criteria_version VARCHAR(20) NOT NULL DEFAULT 'v1'
);

CREATE TABLE properties (
  id UUID PRIMARY KEY,
  state_code CHAR(2) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  property_type VARCHAR(40) NOT NULL,
  occupancy_type VARCHAR(40) NOT NULL,
  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  list_price NUMERIC,
  estimated_value NUMERIC,
  equity_pct NUMERIC,
  distress_flags JSONB,
  owner_flags JSONB,
  market JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_search ON properties (state_code, mode, property_type, occupancy_type);
```

---

## 12) UI/UX Flow

1. User chooses **Residential** or **Commercial** mode.
2. User selects **state**, property types, occupancy options, and strategy toggles.
3. Click **Search**.
4. Results return ranked cards + map pins.
5. Each card shows 4 scores, explanation tags, and suggested strategy playbook.
6. User saves/export leads or opens property detail for deeper comps/history.

---

## 13) Development Roadmap

### Phase 1 — MVP (4–6 weeks)
- Hard-coded state criteria layer
- Basic property model + mock dataset
- Search filters + ranked results
- Deterministic scoring + explanation tags
- Core APIs (`/searchProperties`, `/scoreStateStrategies`, `/getStateCriteria`, `/getFilters`)

### Phase 2 — Real Data & Reliability (6–10 weeks)
- Integrate county/provider ingestion pipelines
- Add dedupe, normalization, quality checks
- Add saved searches, exports, favorites
- Add caching and search index tuning

### Phase 3 — Advanced Analytics (8–12 weeks)
- Distress trend analytics
- Comparable sales/rent overlays
- Batch scoring + alerts
- Admin criteria versioning and audit logs

### Phase 4 — Scale & Commercialization
- Team accounts, billing, usage metering
- SLA monitoring, failover, backups
- Compliance and legal review by jurisdiction

---

## 14) Recommended Stack

- **Backend**: TypeScript (Node.js, NestJS/Fastify)
- **Frontend**: Next.js + React + TypeScript
- **DB**: PostgreSQL + PostGIS
- **Search**: OpenSearch/Elasticsearch
- **Cache/Queue**: Redis + BullMQ
- **Cloud**: AWS (RDS, OpenSearch, ECS/Lambda, S3, CloudFront)
- **Observability**: OpenTelemetry + Grafana/Datadog

---

## 15) Example End-to-End Flow (Combination Filter)

Input: `Florida + SFR + Vacant + Preforeclosure`
- Filter reduces set to matching records.
- State criteria for FL loaded:
  - Judicial foreclosure
  - Friendly lease-option
  - Minimal owner-financing restrictions
  - Short redemption
  - Strong homestead
  - Landlord-friendly
- Scoring engine applies state points + occupancy/distress modifiers.
- Output includes ranked properties, 4 scores, and explanation tags.

This design is implementation-ready and can be split directly into backend modules, API contracts, and UI tasks.
