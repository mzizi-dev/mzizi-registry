/**
 * Mukoko Architecture System — Single source of truth for ecosystem architecture data.
 *
 * Powers the architecture documentation pages (/architecture/*) and the
 * Mukoko Architecture API (/api/v1/ecosystem, /api/v1/data-layer, /api/v1/pipeline, /api/v1/sovereignty).
 *
 * Based on the Mukoko Platform Local-First Architecture & Data Strategy document.
 *
 * Install via: npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/architecture
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArchitecturePrinciple {
  name: string
  title: string
  description: string
  rationale: string
  implementation: string
}

export interface PlatformTarget {
  name: string
  strategy: string
  status: "production" | "planned" | "research"
}

export interface FrameworkDecision {
  name: string
  approach: string
  framework: string
  rationale: string
  sovereigntyAdvantage: string
  platforms: PlatformTarget[]
  harmonyOs: {
    approach: string
    rationale: string
    status: string
  }
}

export interface SovereigntyAssessment {
  technology: string
  role: string
  license: string
  governance: string
  sovereigntyRisk: "none" | "low" | "removed"
  forkable: boolean
  selfHostable: boolean
  rationale: string
}

export interface DataLayerTechnology {
  name: string
  role: string
  platform: "native" | "browser" | "both"
  description: string
  sovereignty: SovereigntyAssessment
}

export interface CloudService {
  name: string
  role: string
  consistencyModel: "strict" | "eventual"
  database: string
  dataCategories: string[]
  description: string
  sovereignty: SovereigntyAssessment
}

export interface PipelineStage {
  name: string
  role: string
  description: string
  sovereignty: SovereigntyAssessment
}

export interface DataOwnershipRule {
  category: string
  consistencyModel: "strict" | "eventual" | "aggregate"
  database: string
  examples: string[]
  conflictResolution: string
  ownership: "user-private" | "community-shared" | "public-open"
  description: string
}

export interface RemovedTechnology {
  name: string
  previousRole: string
  reason: string
  replacement: string
  migrationPath: string
}

// ─── Architecture Principles ─────────────────────────────────────────────────

export const ARCHITECTURE_PRINCIPLES: ArchitecturePrinciple[] = [
  {
    name: "ubuntu",
    title: "Ubuntu Philosophy",
    description: "I am because we are — every architectural decision flows from communal benefit.",
    rationale: "Mukoko is Africa's super app built not as a copy of Western or Eastern platforms, but as a genuinely African product rooted in the Ubuntu philosophy. The platform exists to serve communities, not extract from them.",
    implementation: "Open data layer shares anonymised platform intelligence with the continent. Community-contributed data syncs across all devices. Platform data belongs to Africa.",
  },
  {
    name: "local-first",
    title: "Local-First",
    description: "The device is the primary source of truth. The cloud is a synchronisation and backup layer, not a dependency.",
    rationale: "Mukoko must work fully — browsing, payments, community content, weather data — in a village with no connectivity, on a phone with 2G, or in a city with intermittent wifi. The infrastructure must match the reality of African users' lives.",
    implementation: "RxDB with SQLite (native) or IndexedDB (browser) as the local database. Reads and writes happen locally without network round-trips. CouchDB and Supabase sync when connectivity exists.",
  },
  {
    name: "mobile-first",
    title: "Mobile-First",
    description: "The primary interface is a mobile device with constrained resources.",
    rationale: "Architecture is designed for small screens, limited battery, constrained data plans, and the hardware reality of the African smartphone market — including Android, iOS, and critically, Huawei HarmonyOS devices.",
    implementation: "Next.js + Capacitor as a thin native shell. 48px minimum touch targets. Progressive loading. Lazy sections with memory pressure monitoring.",
  },
  {
    name: "open-source-sovereign",
    title: "Open Source & Sovereign",
    description: "Choose genuinely open source alternatives over proprietary corporate technologies.",
    rationale: "Strategic risk management. External corporate dependencies can be weaponised. Huawei exists as a company building its own OS precisely because external dependencies were used against it. Mukoko thinks about this before it becomes a crisis.",
    implementation: "Every technology assessed for sovereignty risk. Apache-licensed and public domain technologies preferred. All core infrastructure is self-hostable and forkable. MongoDB removed for SSPL license concerns.",
  },
  {
    name: "open-data",
    title: "Open Data",
    description: "Platform-level, anonymised, aggregate data is Mukoko's gift to the continent, not its moat.",
    rationale: "Researchers, journalists, governments, developers, and NGOs across Africa should be able to query what the Mukoko community collectively knows about weather, foot traffic, economic activity, and community life. Personal data remains private and protected. Platform data belongs to Africa.",
    implementation: "Apache Doris as the open data engine. Apache Flink strips all PII before data reaches the analytical layer. Public REST API for open data queries. MySQL-compatible SQL interface for researchers.",
  },
]

// ─── Framework Decision ──────────────────────────────────────────────────────

export const FRAMEWORK_DECISION: FrameworkDecision = {
  name: "next-js-capacitor",
  approach: "web-first",
  framework: "Next.js + Capacitor",
  rationale: "The two dominant cross-platform frameworks (Flutter/React Native) are controlled by large American corporations. Capacitor runs web standards — HTML, CSS, JavaScript — inside a native WebView. Web standards are governed by the W3C and WHATWG (international standards bodies), and JavaScript by ECMA International (Swiss). This is also precisely the architecture that WeChat and Alipay converged on — a runtime environment hosting mini-applications built on web standards.",
  sovereigntyAdvantage: "No framework vendor holds the platform hostage. Sub-apps are web applications that can run in any browser, on HarmonyOS's WebView, or on a future Nyuchi-built runtime.",
  platforms: [
    { name: "android", strategy: "capacitor-native", status: "production" },
    { name: "ios", strategy: "capacitor-native", status: "production" },
    { name: "web", strategy: "pwa", status: "production" },
    { name: "harmonyos", strategy: "webview", status: "planned" },
  ],
  harmonyOs: {
    approach: "Huawei ships their own WebView engine (Chromium-based, maintained independently of Google). A web-standards Capacitor application runs on HarmonyOS without requiring Google Mobile Services, Google Play, or any American-controlled infrastructure.",
    rationale: "Mukoko's own authentication and wallet replace the platform services that would otherwise require GMS. HarmonyOS compatibility is structurally solved rather than patched.",
    status: "planned",
  },
}

// ─── Local Data Layer ────────────────────────────────────────────────────────

export const LOCAL_DATA_LAYER: DataLayerTechnology[] = [
  {
    name: "rxdb",
    role: "Local-first reactive database layer",
    platform: "both",
    description: "Application-facing database providing schema validation, reactive queries (UI components automatically update when data changes), conflict resolution, and a replication protocol for syncing with the cloud. The storage layer is swappable via the RxStorage adapter pattern — application code is identical whether the engine is IndexedDB or SQLite.",
    sovereignty: {
      technology: "RxDB",
      role: "Local database layer",
      license: "Apache-2.0",
      governance: "independent",
      sovereigntyRisk: "low",
      forkable: true,
      selfHostable: true,
      rationale: "Independent open source project with Apache license. Fully forkable.",
    },
  },
  {
    name: "sqlite",
    role: "Mobile storage engine",
    platform: "native",
    description: "Uses the SQLite engine that Apple, Google, and Huawei all ship natively in their operating systems. Zero extra app size and a battle-hardened implementation maintained by the OS vendor. SQLite is public domain — not MIT, not Apache — completely, unconditionally public domain. No corporation owns it. No government can threaten access to it.",
    sovereignty: {
      technology: "SQLite",
      role: "Mobile storage engine",
      license: "Public Domain",
      governance: "public-domain",
      sovereigntyRisk: "none",
      forkable: true,
      selfHostable: true,
      rationale: "Public domain. No owner. No corporation. No government can threaten access.",
    },
  },
  {
    name: "indexeddb-dexie",
    role: "Browser storage",
    platform: "browser",
    description: "IndexedDB is the browser's built-in structured storage API — a web standard governed by the W3C, available in every modern browser. Dexie is a lightweight IndexedDB wrapper that RxDB uses as its browser storage adapter, making IndexedDB's API significantly more ergonomic.",
    sovereignty: {
      technology: "IndexedDB / Dexie",
      role: "Browser storage",
      license: "Web Standard / MIT",
      governance: "w3c",
      sovereigntyRisk: "none",
      forkable: true,
      selfHostable: true,
      rationale: "Web standard governed by the W3C. Dexie is MIT licensed and independent.",
    },
  },
  {
    name: "pouchdb",
    role: "Sync bridge",
    platform: "both",
    description: "CouchDB's philosophy and protocol implemented entirely in JavaScript. Runs inside the browser or Capacitor app, stores data in IndexedDB or SQLite, and speaks CouchDB's exact sync protocol. PouchDB and CouchDB do not think of each other as server and client — they are peers exchanging sequence numbers and change sets.",
    sovereignty: {
      technology: "PouchDB",
      role: "Client-side sync",
      license: "Apache-2.0",
      governance: "independent",
      sovereigntyRisk: "low",
      forkable: true,
      selfHostable: true,
      rationale: "Apache-licensed independent open source project.",
    },
  },
]

// ─── Cloud Layer ─────────────────────────────────────────────────────────────

export const CLOUD_LAYER: CloudService[] = [
  {
    name: "supabase-postgresql",
    role: "Structured, relational, consistent data",
    consistencyModel: "strict",
    database: "PostgreSQL",
    dataCategories: ["user-identity", "authentication", "wallet-balances", "transaction-records", "billing", "subscription-state", "relational-roles"],
    description: "Open source Firebase alternative built on PostgreSQL. Provides managed Postgres, real-time change subscriptions, row-level security, and REST/GraphQL API. Apache 2.0 licensed and fully self-hostable. Handles data requiring strict consistency — two conflicting versions of a wallet balance are never acceptable. The relational model, foreign keys, and ACID transactions provide the guarantees that money requires.",
    sovereignty: {
      technology: "Supabase / PostgreSQL",
      role: "Relational cloud database",
      license: "Apache-2.0",
      governance: "corporate-open",
      sovereigntyRisk: "low",
      forkable: true,
      selfHostable: true,
      rationale: "Apache 2.0 licensed, fully self-hostable. If Nyuchi Africa ever needs its own instance on African cloud infrastructure, that option exists.",
    },
  },
  {
    name: "apache-couchdb",
    role: "Document sync for community and content data",
    consistencyModel: "eventual",
    database: "CouchDB",
    dataCategories: ["community-posts", "weather-observations", "campsite-listings", "event-details", "ai-conversation-histories", "feed-posts"],
    description: "Apache 2.0 licensed, governed by the Apache Software Foundation. Designed around the principle that every node is equal — every CouchDB instance is a full peer that can accept writes and sync with any other instance. No single point of failure. Tracks changes through a changes feed with revision history. Conflict resolution preserves both versions rather than silently picking a winner.",
    sovereignty: {
      technology: "Apache CouchDB",
      role: "Cloud document sync",
      license: "Apache-2.0",
      governance: "apache-foundation",
      sovereigntyRisk: "none",
      forkable: true,
      selfHostable: true,
      rationale: "Apache Foundation (non-profit). No corporate owner. Multi-master replication with no hierarchy.",
    },
  },
]

// ─── Open Data Pipeline ──────────────────────────────────────────────────────

export const OPEN_DATA_PIPELINE: PipelineStage[] = [
  {
    name: "redpanda",
    role: "Event streaming backbone",
    description: "Kafka-compatible event streaming platform written in Rust. Every meaningful event — weather observations, campsite views, payments, posts — flows through as an event stream. Supabase and CouchDB publish change feeds into topics. Downstream systems consume independently. Provides architectural decoupling: operational databases do not need to know about the analytics layer.",
    sovereignty: {
      technology: "Redpanda",
      role: "Event streaming",
      license: "BSL / Apache-2.0",
      governance: "independent",
      sovereigntyRisk: "low",
      forkable: true,
      selfHostable: true,
      rationale: "Kafka-compatible, lower operational overhead. Speaks the Kafka protocol — all Kafka tooling works without modification.",
    },
  },
  {
    name: "apache-flink",
    role: "Stream processing and privacy filter",
    description: "Consumes the raw event stream and applies transformations in real time before data reaches the open data layer. The most important transformation is the privacy filter — strips all personal identifiers (user IDs, IP addresses, device fingerprints), aggregates individual events into anonymised summaries, enriches records with geographic and temporal metadata, and outputs clean, safe, open data. The open data layer is structurally incapable of leaking personal information because personal information never enters it.",
    sovereignty: {
      technology: "Apache Flink",
      role: "Stream processing",
      license: "Apache-2.0",
      governance: "apache-foundation",
      sovereigntyRisk: "none",
      forkable: true,
      selfHostable: true,
      rationale: "Apache Foundation (non-profit). No corporate owner.",
    },
  },
  {
    name: "apache-doris",
    role: "Open data analytical database",
    description: "Real-time analytical database originally built by Baidu, donated to the Apache Software Foundation. Designed for super app data scale — billions of rows, complex analytical queries, real-time ingestion. Columnar storage format means analytical queries only read relevant columns. Ingests the processed, anonymised event stream from Flink in real time. Exposes a MySQL-compatible SQL interface for researchers and a public REST API for developers.",
    sovereignty: {
      technology: "Apache Doris",
      role: "Analytical / open data",
      license: "Apache-2.0",
      governance: "apache-foundation",
      sovereigntyRisk: "none",
      forkable: true,
      selfHostable: true,
      rationale: "Apache Foundation (non-profit). No corporate owner. MySQL-compatible interface.",
    },
  },
]

// ─── Data Ownership Rules ────────────────────────────────────────────────────

export const DATA_OWNERSHIP_RULES: DataOwnershipRule[] = [
  {
    category: "personal",
    consistencyModel: "strict",
    database: "Supabase / PostgreSQL",
    examples: ["user-identity", "wallet-balances", "transaction-records", "billing-state", "authentication"],
    conflictResolution: "Strict handler — flags conflicts and holds for explicit reconciliation. The system shows a 'reconciling your account' message rather than silently picking a winner and potentially misrepresenting a balance.",
    ownership: "user-private",
    description: "Who a user is, what they bought, who they messaged — private, protected, and belongs to the user. Two conflicting versions are never acceptable. Postgres ACID guarantees and RxDB strict conflict handlers ensure this.",
  },
  {
    category: "community",
    consistencyModel: "eventual",
    database: "Apache CouchDB",
    examples: ["community-posts", "weather-observations", "campsite-listings", "event-details", "ai-conversations", "feed-posts"],
    conflictResolution: "Permissive handler — merges changes automatically using last-write-wins or CRDT merge strategies. A few seconds of propagation delay is acceptable.",
    ownership: "community-shared",
    description: "Community-contributed content that tolerates eventual consistency. CouchDB multi-master replication handles sync elegantly. Conflict resolution preserves both versions and gives the application information to resolve intelligently.",
  },
  {
    category: "platform-open",
    consistencyModel: "aggregate",
    database: "Apache Doris",
    examples: ["regional-weather-patterns", "foot-traffic-trends", "anonymised-economic-activity", "usage-patterns"],
    conflictResolution: "Not applicable — aggregate data is append-only and computed from anonymised event streams.",
    ownership: "public-open",
    description: "Anonymised, aggregate platform intelligence. Not Mukoko's moat — Mukoko's gift to the continent. Researchers, journalists, governments, NGOs, and developers can query this data without asking Nyuchi Africa for permission.",
  },
]

// ─── Removed Technologies ────────────────────────────────────────────────────

export const REMOVED_TECHNOLOGIES: RemovedTechnology[] = [
  {
    name: "mongodb",
    previousRole: "Document database for the weather app",
    reason: "MongoDB switched its license in 2018 from AGPL to SSPL (Server Side Public License). The Open Source Initiative does not recognise SSPL as a genuine open source license. For a platform built on sovereignty and open source principles, this is disqualifying.",
    replacement: "Apache CouchDB",
    migrationPath: "Weather observation data maps directly to CouchDB documents. The data access layer switches from Motor/Mongoose to CouchDB HTTP API or the nano Node.js client. RxDB on the device handles local caching and sync transparently. The migration unlocks the open data story — once observations flow through the Flink anonymisation pipeline into Doris, Mukoko can publish a public API for community-sourced weather data.",
  },
]

// ─── Sovereignty Summary ─────────────────────────────────────────────────────

export const SOVEREIGNTY_SUMMARY: SovereigntyAssessment[] = [
  {
    technology: "Next.js",
    role: "UI framework",
    license: "MIT",
    governance: "corporate-open",
    sovereigntyRisk: "low",
    forkable: true,
    selfHostable: true,
    rationale: "Vercel-maintained but MIT licensed with open community.",
  },
  {
    technology: "Capacitor",
    role: "Native wrapper",
    license: "MIT",
    governance: "corporate-open",
    sovereigntyRisk: "low",
    forkable: true,
    selfHostable: true,
    rationale: "Ionic-maintained but MIT licensed with open community.",
  },
  ...LOCAL_DATA_LAYER.map((t) => t.sovereignty),
  ...CLOUD_LAYER.map((s) => s.sovereignty),
  ...OPEN_DATA_PIPELINE.map((p) => p.sovereignty),
  {
    technology: "MongoDB",
    role: "Document database (removed)",
    license: "SSPL",
    governance: "corporate-proprietary",
    sovereigntyRisk: "removed",
    forkable: false,
    selfHostable: false,
    rationale: "SSPL is not recognised as open source by the OSI. Removed from the stack.",
  },
]

// ─── Full Architecture System (for API serialization) ────────────────────────

export const ARCHITECTURE_SYSTEM = {
  $schema: "https://registry.mukoko.com/schema/architecture.json",
  "@context": "https://schema.org",
  "@type": "TechArticle",
  version: "4.0.1",
  name: "Mukoko Architecture System",
  lastUpdated: "2026-03-14",
  homepage: "https://registry.mukoko.com/architecture",
  principles: ARCHITECTURE_PRINCIPLES,
  frameworkDecision: FRAMEWORK_DECISION,
  localDataLayer: LOCAL_DATA_LAYER,
  cloudLayer: CLOUD_LAYER,
  openDataPipeline: OPEN_DATA_PIPELINE,
  dataOwnership: DATA_OWNERSHIP_RULES,
  removedTechnologies: REMOVED_TECHNOLOGIES,
  sovereigntySummary: SOVEREIGNTY_SUMMARY,
}
