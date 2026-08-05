/**
 * Sample-data types — the shapes Mzizi components render against.
 *
 * THESE ARE NOT INVENTED. Each mirrors a MongoDB collection validator on the live
 * platform cluster, field for field, at the subset a UI actually reads:
 *
 *   SamplePlace   → places.places          (schema.org Place, `_schemaVersion` v3.2)
 *   SampleEntity  → entity.entities        (schema.org Organization, the bundu trust block)
 *   SamplePerson  → identity.persons       (OIDC claims + bundu)
 *   SampleEvent   → events.events          (schema.org Event, iCal fields)
 *   SampleProduct → commerce.products      (schema.org Product, Offer[])
 *   SampleArticle → news.articles          (schema.org NewsArticle)
 *
 * That correspondence is the entire point, and it is what makes this more than
 * lorem ipsum. A consumer wiring `nyuchi-place-card` to their own
 * `places.places` collection has the mapping already done, because the component
 * was built against a document of exactly that shape. Getting a preview working
 * and getting a consumer's integration working stop being two jobs.
 *
 * WHY A CURATED SET RATHER THAN READING THE PRODUCTION COLLECTIONS.
 *
 * Measured, not assumed. `places.places` holds 15,359 documents; **38** have a
 * description and **zero** have `media`. They are bare OSM name-and-geometry
 * imports. `events.events` holds one document. `commerce.products` holds two.
 * A place card rendered against production is a grey box with a name on it —
 * there is no data to preview against, so the choice is not "curated vs. real",
 * it is "curated vs. nothing".
 *
 * Three further reasons it stays curated even once production fills up:
 *
 *   1. **Publishing.** mzizi.dev is public. Production records are real people,
 *      real businesses and unverified community reports; `places_public` exists
 *      as a view precisely because some fields must not leave the cluster. A
 *      design-system preview is not the place to make that call implicitly.
 *   2. **Stability.** A preview that changes because someone edited a production
 *      row is not a preview. Screenshots, visual diffs and docs all need the
 *      same bytes tomorrow.
 *   3. **Coverage.** Real data clusters around the easy case. A fixture set is
 *      chosen to break things: the name with no image, the 200-character title,
 *      the zero-review business, the sold-out product, the cancelled event.
 */

/** GeoJSON Point — `[longitude, latitude]`, in that order, as GeoJSON requires. */
export interface GeoPoint {
  type: "Point"
  coordinates: [number, number]
}

/** schema.org PostalAddress, at the fields the platform stores. */
export interface PostalAddress {
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

/**
 * The `bundu` trust block, common to places, entities and products.
 *
 * `verificationTier` is 0-3 (0 = unclaimed, 1 = claimed/community-verified,
 * 2 = verified, 3 = fully verified). The agent write-cliff is at 0 → 1, which is
 * why a component showing tier is showing something load-bearing rather than a
 * decoration.
 */
export interface BunduTrust {
  verificationTier: 0 | 1 | 2 | 3
  trustSignals?: {
    communityVouches?: number
    reviewCount?: number
    averageRating?: number | null
    ubuntuScore?: number | null
    yearsActive?: number | null
    responseRate?: number | null
  }
  informalEconomy?: {
    isInformal?: boolean
    operatingModel?:
      "cooperative" | "individual" | "family_run" | "community_managed" | "rotating" | "association"
    operatesAt?: "fixed_location" | "mobile" | "home_based" | "seasonal" | "event_based"
    registrationStatus?: "unregistered" | "pending" | "tax_only" | "fully_registered"
  }
}

export interface SamplePlace {
  _id: string
  name: string
  slug: string
  description: string | null
  placeType: string[]
  tags: string[]
  geo: GeoPoint
  address: PostalAddress | null
  /**
   * Images are absolute URLs on a host the preview can actually load. A relative
   * path would resolve against mzizi.dev and 404 in a consumer's app.
   */
  media: { coverImage: string | null; image: string[]; logo?: string | null } | null
  openingHours?: string[]
  telephone?: string | null
  url?: string | null
  hospitality?: {
    servesCuisine?: string[]
    priceRange?: string | null
    hasWifi?: boolean | null
    hasParking?: boolean | null
    acceptsReservations?: boolean | null
    starRating?: { ratingValue: number; bestRating: number } | null
  } | null
  access?: { isAccessibleForFree?: boolean | null; permitRequired?: boolean | null } | null
  discovery?: {
    featured?: boolean
    aggregateRating?: { value: number; count: number } | null
    viewCount?: number
  } | null
  bundu: BunduTrust
}

export interface SampleEntity {
  _id: string
  name: string
  slug: string
  description: string | null
  entityType: "family" | "organization" | "community" | "place_owner"
  schemaOrgType: string
  ecosystemRole: "foundation" | "pillar" | "initiative" | "product" | "external"
  logo: string | null
  url: string | null
  address: PostalAddress | null
  memberCount?: number | null
  bundu: BunduTrust
}

export interface SamplePerson {
  _id: string
  name: string
  givenName: string
  familyName: string
  email: string
  emailVerified: boolean
  picture: string | null
  /** Job or role label — what a profile card shows under the name. */
  headline?: string | null
  bundu?: { verificationTier: 0 | 1 | 2 | 3; defaultFamilyEntityId?: string | null }
}

export interface SampleEvent {
  _id: string
  name: string
  slug: string
  description: string | null
  schemaOrgType: string
  /** ISO 8601. Strings, not `Date` — see the note in `data.ts` on determinism. */
  startDate: string
  endDate: string
  eventStatus:
    "EventScheduled" | "EventCancelled" | "EventMovedOnline" | "EventPostponed" | "EventRescheduled"
  attendanceMode:
    "OfflineEventAttendanceMode" | "OnlineEventAttendanceMode" | "MixedEventAttendanceMode"
  isAccessibleForFree: boolean
  location: { name: string; address?: PostalAddress | null } | null
  image: string[]
  offers: SampleOffer[]
  totalAttendeeCount: number
  maximumAttendeeCapacity: number | null
  primaryHostEntityId: string
  tags: string[]
}

export interface SampleOffer {
  price: number
  priceCurrency: string
  availability: "InStock" | "OutOfStock" | "PreOrder" | "SoldOut" | "LimitedAvailability"
  name?: string
  validThrough?: string | null
}

export interface SampleProduct {
  _id: string
  name: string
  slug: string
  description: string
  productType:
    | "physical_good"
    | "digital_good"
    | "service"
    | "rental"
    | "experience"
    | "subscription"
    | "ticket"
    | "land_use"
  schemaOrgType: string
  category: string | null
  sku: string | null
  image: string[]
  offers: SampleOffer[]
  inventoryLevel: number | null
  status: "draft" | "active" | "paused" | "out_of_stock" | "discontinued" | "archived"
  sellerEntityId: string
  bundu: BunduTrust
}

export interface SampleArticle {
  _id: string
  headline: string
  slug: string
  description: string | null
  articleBody: string | null
  articleSection: string | null
  datePublished: string
  image: string[]
  inLanguage: string
  wordCount: number | null
  mediaOrganizationId: string
  /** Denormalised for display — a card should not have to join to render. */
  publisherName: string
  authorName: string | null
}

/** Every sample entity type, keyed by the name the resolver and API use. */
export interface SampleData {
  places: SamplePlace[]
  entities: SampleEntity[]
  persons: SamplePerson[]
  events: SampleEvent[]
  products: SampleProduct[]
  articles: SampleArticle[]
}

export type SampleType = keyof SampleData
