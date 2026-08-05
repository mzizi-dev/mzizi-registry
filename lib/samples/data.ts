/**
 * The Mzizi sample dataset — the data every component preview renders against.
 *
 * AUTHORED HERE, IN GIT. Read `lib/samples/types.ts` first for why the shapes are
 * what they are and why this is curated rather than pulled from the production
 * collections.
 *
 * ONE SOURCE, TWO DISTRIBUTION SURFACES.
 *
 *   this file ──┬─► lib/samples (the app, /playground, /components, the API)
 *               └─► `pnpm samples:push` ─► MongoDB `mzizi_samples` (agents, consumer apps)
 *
 * MongoDB gets filled, and it is not the authoring surface. That distinction is
 * deliberate and it is the one thing to understand before changing this:
 *
 *   * A consumer or an agent that wants to develop against realistic data points
 *     a real driver at `mzizi_samples` and queries documents in the production
 *     shape. That is the "wiring is already done" property.
 *   * The site does NOT query Mongo to render a preview. 1,179 pages are
 *     statically prerendered; a per-page round trip would be slow, and worse, a
 *     Mongo outage would empty the playground. Reading the file means a preview
 *     cannot break for a reason that has nothing to do with the component.
 *
 * Pushing derives Mongo from git, never the reverse. If someone edits a document
 * in `mzizi_samples` directly, the next push overwrites it — which is correct:
 * this file is where a change gets reviewed.
 *
 * NO `new Date()`, NO RANDOMNESS, ANYWHERE IN THIS FILE. Dates are ISO strings
 * and ids are fixed. A fixture that changes between two renders is not a fixture:
 * it breaks static prerendering (server and client disagree), it makes visual
 * diffs noise, and it makes a failing test unreproducible. Relative dates like
 * "in 3 days" are the component's job to compute from a fixed instant.
 *
 * IMAGES are `picsum.photos` seeded URLs — deterministic (the same seed always
 * returns the same photograph), square by default per the §7.6 media rule, and
 * needing no API key. They are real remote URLs because that is what a real
 * record holds; a data-URI would render offline but would stop exercising the
 * loading and error states every image component has.
 */

import type { SampleData } from "./types"

const img = (seed: string, w = 800, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`

/**
 * The instant every relative date in this dataset is expressed against.
 * Components that render "in 3 days" should take a `now` prop in previews rather
 * than reading the clock, so the output is stable.
 */
export const SAMPLE_NOW = "2026-06-15T09:00:00.000Z"

export const sampleData: SampleData = {
  // ── Places ────────────────────────────────────────────────────────────────
  // Chosen to break layouts, not to flatter them: a protected area with a long
  // name, a township restaurant with no cover image, an informal trader with
  // zero reviews, and a five-star lodge with a full hospitality block.
  places: [
    {
      _id: "smpl-place-0001",
      name: "Mana Pools National Park",
      slug: "mana-pools-national-park",
      description:
        "A UNESCO World Heritage Site on the Zambezi floodplain, known for walking safaris and the winterthorn woodland that draws elephant herds to the river in the dry season.",
      placeType: ["Park", "TouristAttraction"],
      tags: ["boundary=protected_area", "leisure=nature_reserve", "tourism=attraction"],
      geo: { type: "Point", coordinates: [29.3833, -15.7333] },
      address: { addressRegion: "Mashonaland West", addressCountry: "ZW" },
      media: {
        coverImage: img("mana-pools", 1200, 1200),
        image: [img("mana-pools", 1200, 1200), img("mana-pools-2", 800, 800)],
      },
      access: { isAccessibleForFree: false, permitRequired: true },
      discovery: { featured: true, aggregateRating: { value: 4.8, count: 214 }, viewCount: 18420 },
      bundu: {
        verificationTier: 3,
        trustSignals: {
          communityVouches: 46,
          reviewCount: 214,
          averageRating: 4.8,
          ubuntuScore: 92,
        },
      },
    },
    {
      _id: "smpl-place-0002",
      name: "Gonarezhou National Park and the Chilojo Cliffs Conservation Area",
      slug: "gonarezhou-chilojo-cliffs",
      // Deliberately long. A name that wraps to three lines is where card
      // layouts break, and no real record is obliged to be short.
      description:
        "The second-largest park in Zimbabwe, its red sandstone Chilojo Cliffs rising above the Runde River. Part of the Great Limpopo Transfrontier Park.",
      placeType: ["Park", "TouristAttraction"],
      tags: ["boundary=protected_area", "natural=cliff"],
      geo: { type: "Point", coordinates: [31.5, -21.6667] },
      address: { addressRegion: "Masvingo", addressCountry: "ZW" },
      media: { coverImage: img("gonarezhou", 1200, 1200), image: [img("gonarezhou", 1200, 1200)] },
      access: { isAccessibleForFree: false, permitRequired: true },
      discovery: { featured: false, aggregateRating: { value: 4.6, count: 88 }, viewCount: 5310 },
      bundu: {
        verificationTier: 2,
        trustSignals: { communityVouches: 12, reviewCount: 88, averageRating: 4.6 },
      },
    },
    {
      _id: "smpl-place-0003",
      name: "Amai Rudo's Kitchen",
      slug: "amai-rudos-kitchen",
      description:
        "A family-run sadza and stew counter in Mbare, open from before dawn for the market traders. Cash and EcoCash.",
      placeType: ["Restaurant", "LocalBusiness"],
      tags: ["amenity=restaurant", "cuisine=zimbabwean"],
      geo: { type: "Point", coordinates: [31.0335, -17.8631] },
      address: { streetAddress: "Mbare Musika", addressLocality: "Harare", addressCountry: "ZW" },
      // No cover image on purpose — most informal-economy records have none, and
      // a card that only looks right with a photo is a card that breaks in
      // production for exactly the sellers this system exists to serve.
      media: { coverImage: null, image: [] },
      openingHours: ["Mo-Sa 05:00-16:00"],
      telephone: "+263 77 000 0000",
      hospitality: {
        servesCuisine: ["Zimbabwean"],
        priceRange: "$",
        hasWifi: false,
        acceptsReservations: false,
      },
      discovery: { featured: false, aggregateRating: { value: 4.9, count: 31 }, viewCount: 640 },
      bundu: {
        verificationTier: 1,
        trustSignals: {
          communityVouches: 23,
          reviewCount: 31,
          averageRating: 4.9,
          yearsActive: 11,
        },
        informalEconomy: {
          isInformal: true,
          operatingModel: "family_run",
          operatesAt: "fixed_location",
          registrationStatus: "unregistered",
        },
      },
    },
    {
      _id: "smpl-place-0004",
      name: "Nyanga Highlands Lodge",
      slug: "nyanga-highlands-lodge",
      description:
        "Sixteen rooms above the Pungwe Valley, with trout fishing, guided walks to Mtarazi Falls and a fire in every room from May.",
      placeType: ["Accommodation", "LocalBusiness"],
      tags: ["tourism=hotel"],
      geo: { type: "Point", coordinates: [32.7667, -18.2167] },
      address: { addressLocality: "Nyanga", addressRegion: "Manicaland", addressCountry: "ZW" },
      media: {
        coverImage: img("nyanga-lodge", 1200, 1200),
        image: [img("nyanga-lodge", 1200, 1200), img("nyanga-lodge-2", 800, 800)],
        logo: img("nyanga-logo", 200, 200),
      },
      url: "https://example.co.zw/nyanga-highlands",
      hospitality: {
        priceRange: "$$$",
        hasWifi: true,
        hasParking: true,
        acceptsReservations: true,
        starRating: { ratingValue: 4, bestRating: 5 },
      },
      discovery: { featured: true, aggregateRating: { value: 4.4, count: 127 }, viewCount: 9260 },
      bundu: {
        verificationTier: 2,
        trustSignals: {
          communityVouches: 8,
          reviewCount: 127,
          averageRating: 4.4,
          responseRate: 0.94,
        },
      },
    },
    {
      _id: "smpl-place-0005",
      name: "Tendai Motors",
      slug: "tendai-motors",
      description: null,
      // Description null AND zero reviews — the brand-new unclaimed listing.
      // Every "empty state" branch in a card should be reachable from the sample
      // set, or it is a branch nobody ever looks at.
      placeType: ["LocalBusiness"],
      tags: ["shop=car_repair"],
      geo: { type: "Point", coordinates: [28.5833, -20.15] },
      address: { addressLocality: "Bulawayo", addressCountry: "ZW" },
      media: null,
      discovery: { featured: false, aggregateRating: null, viewCount: 12 },
      bundu: {
        verificationTier: 0,
        trustSignals: { communityVouches: 0, reviewCount: 0, averageRating: null },
      },
    },
    {
      _id: "smpl-place-0006",
      name: "Victoria Falls",
      slug: "victoria-falls",
      description:
        "Mosi-oa-Tunya, the smoke that thunders. The largest sheet of falling water on earth, shared between Zimbabwe and Zambia.",
      placeType: ["TouristAttraction", "Landform"],
      tags: ["waterway=waterfall", "tourism=attraction"],
      geo: { type: "Point", coordinates: [25.8572, -17.9243] },
      address: {
        addressLocality: "Victoria Falls",
        addressRegion: "Matabeleland North",
        addressCountry: "ZW",
      },
      media: {
        coverImage: img("victoria-falls", 1200, 1200),
        image: [
          img("victoria-falls", 1200, 1200),
          img("victoria-falls-2", 800, 800),
          img("victoria-falls-3", 800, 800),
        ],
      },
      access: { isAccessibleForFree: false, permitRequired: false },
      discovery: {
        featured: true,
        aggregateRating: { value: 4.9, count: 3042 },
        viewCount: 214800,
      },
      bundu: {
        verificationTier: 3,
        trustSignals: {
          communityVouches: 190,
          reviewCount: 3042,
          averageRating: 4.9,
          ubuntuScore: 98,
        },
      },
    },
  ],

  // ── Entities ──────────────────────────────────────────────────────────────
  entities: [
    {
      _id: "smpl-entity-0001",
      name: "Bundu Foundation",
      slug: "bundu-foundation",
      description:
        "Steward of the open architecture the ecosystem is built on — Mzizi, the Ubuntu doctrine, and the shared data standards.",
      entityType: "organization",
      schemaOrgType: "NGO",
      ecosystemRole: "foundation",
      logo: img("bundu-logo", 200, 200),
      url: "https://bundu.org",
      address: { addressLocality: "Harare", addressCountry: "ZW" },
      memberCount: 24,
      bundu: {
        verificationTier: 3,
        trustSignals: { communityVouches: 88, reviewCount: 0, ubuntuScore: 100 },
      },
    },
    {
      _id: "smpl-entity-0002",
      name: "Nyuchi Africa",
      slug: "nyuchi-africa",
      description: "Operates Mzizi and builds the enterprise surfaces of the ecosystem.",
      entityType: "organization",
      schemaOrgType: "Corporation",
      ecosystemRole: "pillar",
      logo: img("nyuchi-logo", 200, 200),
      url: "https://nyuchi.com",
      address: { addressLocality: "Harare", addressCountry: "ZW" },
      memberCount: 11,
      bundu: {
        verificationTier: 3,
        trustSignals: { communityVouches: 40, reviewCount: 0, ubuntuScore: 95 },
      },
    },
    {
      _id: "smpl-entity-0003",
      name: "Chikomba Weavers Cooperative",
      slug: "chikomba-weavers",
      description:
        "Forty-two women weaving sisal and cotton in Chikomba district, selling through markets in Harare and online since 2019.",
      entityType: "community",
      schemaOrgType: "Organization",
      ecosystemRole: "external",
      logo: null,
      url: null,
      address: {
        addressLocality: "Chikomba",
        addressRegion: "Mashonaland East",
        addressCountry: "ZW",
      },
      memberCount: 42,
      bundu: {
        verificationTier: 1,
        trustSignals: { communityVouches: 31, reviewCount: 64, averageRating: 4.7, yearsActive: 7 },
        informalEconomy: {
          isInformal: true,
          operatingModel: "cooperative",
          operatesAt: "fixed_location",
          registrationStatus: "tax_only",
        },
      },
    },
    {
      _id: "smpl-entity-0004",
      name: "The Moyo Family",
      slug: "family-smpl-person-0001",
      description: null,
      // A family entity — private by default, created at signup per Rule 10.
      // Components that render an entity must not assume it is a business.
      entityType: "family",
      schemaOrgType: "Organization",
      ecosystemRole: "external",
      logo: null,
      url: null,
      address: null,
      memberCount: 5,
      bundu: { verificationTier: 0, trustSignals: { communityVouches: 0, reviewCount: 0 } },
    },
    {
      _id: "smpl-entity-0005",
      name: "Kubatana News",
      slug: "kubatana-news",
      description:
        "An independent newsroom covering local government and public spending across Zimbabwe.",
      entityType: "organization",
      schemaOrgType: "NewsMediaOrganization",
      ecosystemRole: "external",
      logo: img("kubatana-logo", 200, 200),
      url: "https://example.co.zw/kubatana",
      address: { addressLocality: "Harare", addressCountry: "ZW" },
      memberCount: 9,
      bundu: {
        verificationTier: 2,
        trustSignals: { communityVouches: 17, reviewCount: 0, ubuntuScore: 74 },
      },
    },
  ],

  // ── Persons ───────────────────────────────────────────────────────────────
  persons: [
    {
      _id: "smpl-person-0001",
      name: "Rudo Moyo",
      givenName: "Rudo",
      familyName: "Moyo",
      email: "rudo.moyo@example.co.zw",
      emailVerified: true,
      picture: img("rudo", 200, 200),
      headline: "Cook and owner, Amai Rudo's Kitchen",
      bundu: { verificationTier: 2, defaultFamilyEntityId: "smpl-entity-0004" },
    },
    {
      _id: "smpl-person-0002",
      name: "Tapiwa Ncube",
      givenName: "Tapiwa",
      familyName: "Ncube",
      email: "tapiwa.ncube@example.co.zw",
      emailVerified: true,
      picture: img("tapiwa", 200, 200),
      headline: "Field guide, Mana Pools",
      bundu: { verificationTier: 3 },
    },
    {
      _id: "smpl-person-0003",
      name: "Farai Chikwanha",
      givenName: "Farai",
      familyName: "Chikwanha",
      email: "farai@example.co.zw",
      emailVerified: false,
      // No picture — every avatar in the system must fall back to initials, and
      // that path only gets exercised if the sample set contains this case.
      picture: null,
      headline: "Reporter, Kubatana News",
      bundu: { verificationTier: 1 },
    },
    {
      _id: "smpl-person-0004",
      name: "Nomsa Dube",
      givenName: "Nomsa",
      familyName: "Dube",
      email: "nomsa.dube@example.co.zw",
      emailVerified: true,
      picture: img("nomsa", 200, 200),
      headline: "Chair, Chikomba Weavers Cooperative",
      bundu: { verificationTier: 2 },
    },
    {
      _id: "smpl-person-0005",
      name: "Tendai Marufu",
      givenName: "Tendai",
      familyName: "Marufu",
      email: "tendai.marufu@example.co.zw",
      emailVerified: true,
      picture: img("tendai", 200, 200),
      headline: "Mechanic, Tendai Motors",
      bundu: { verificationTier: 0 },
    },
  ],

  // ── Events ────────────────────────────────────────────────────────────────
  events: [
    {
      _id: "smpl-event-0001",
      name: "Harare International Carnival",
      slug: "harare-international-carnival",
      description:
        "Four days of street parade, marimba, and food stalls from Africa Unity Square through the avenues.",
      schemaOrgType: "Festival",
      startDate: "2026-08-20T10:00:00.000Z",
      endDate: "2026-08-23T22:00:00.000Z",
      eventStatus: "EventScheduled",
      attendanceMode: "OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: {
        name: "Africa Unity Square",
        address: { addressLocality: "Harare", addressCountry: "ZW" },
      },
      image: [img("carnival", 1200, 1200)],
      offers: [],
      totalAttendeeCount: 4820,
      maximumAttendeeCapacity: null,
      primaryHostEntityId: "smpl-entity-0002",
      tags: ["music", "street", "family"],
    },
    {
      _id: "smpl-event-0002",
      name: "Nhimbe: Chikomba Harvest",
      slug: "nhimbe-chikomba-harvest",
      description:
        "A working nhimbe — the community gathers to bring in the maize together, and eats together after. Bring a hoe.",
      schemaOrgType: "Nhimbe",
      startDate: "2026-06-18T05:30:00.000Z",
      endDate: "2026-06-18T15:00:00.000Z",
      eventStatus: "EventScheduled",
      attendanceMode: "OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: {
        name: "Chikomba communal lands",
        address: { addressRegion: "Mashonaland East", addressCountry: "ZW" },
      },
      image: [],
      offers: [],
      totalAttendeeCount: 38,
      maximumAttendeeCapacity: 60,
      primaryHostEntityId: "smpl-entity-0003",
      tags: ["nhimbe", "agriculture", "community"],
    },
    {
      _id: "smpl-event-0003",
      name: "Mzizi Design Systems Workshop",
      slug: "mzizi-design-systems-workshop",
      description: "A hands-on afternoon building against the registry. Bring a laptop.",
      schemaOrgType: "EducationEvent",
      startDate: "2026-07-02T13:00:00.000Z",
      endDate: "2026-07-02T17:00:00.000Z",
      eventStatus: "EventScheduled",
      attendanceMode: "MixedEventAttendanceMode",
      isAccessibleForFree: false,
      location: {
        name: "Nyuchi Africa, Harare",
        address: { addressLocality: "Harare", addressCountry: "ZW" },
      },
      image: [img("workshop", 1200, 1200)],
      offers: [
        {
          price: 15,
          priceCurrency: "USD",
          availability: "LimitedAvailability",
          name: "General admission",
        },
      ],
      totalAttendeeCount: 28,
      maximumAttendeeCapacity: 30,
      primaryHostEntityId: "smpl-entity-0002",
      tags: ["design", "workshop"],
    },
    {
      _id: "smpl-event-0004",
      name: "Bulawayo Arts Festival",
      slug: "bulawayo-arts-festival",
      description: "Postponed to a date to be confirmed.",
      // A cancelled/postponed event. Every event component has a status branch
      // and it is almost never the one anyone looks at while building.
      schemaOrgType: "Festival",
      startDate: "2026-05-01T09:00:00.000Z",
      endDate: "2026-05-04T21:00:00.000Z",
      eventStatus: "EventPostponed",
      attendanceMode: "OfflineEventAttendanceMode",
      isAccessibleForFree: false,
      location: {
        name: "Bulawayo Theatre",
        address: { addressLocality: "Bulawayo", addressCountry: "ZW" },
      },
      image: [img("bulawayo-arts", 1200, 1200)],
      offers: [{ price: 10, priceCurrency: "USD", availability: "OutOfStock", name: "Day pass" }],
      totalAttendeeCount: 0,
      maximumAttendeeCapacity: 400,
      primaryHostEntityId: "smpl-entity-0005",
      tags: ["arts", "theatre"],
    },
  ],

  // ── Products ──────────────────────────────────────────────────────────────
  products: [
    {
      _id: "smpl-product-0001",
      name: "Handwoven sisal basket, large",
      slug: "handwoven-sisal-basket-large",
      description:
        "Forty centimetres across, woven from sisal and dyed with indigenous bark. Each one takes about nine days.",
      productType: "physical_good",
      schemaOrgType: "Product",
      category: "Home & living",
      sku: "CHK-BSK-L",
      image: [img("sisal-basket", 800, 800), img("sisal-basket-2", 800, 800)],
      offers: [{ price: 45, priceCurrency: "USD", availability: "InStock" }],
      inventoryLevel: 12,
      status: "active",
      sellerEntityId: "smpl-entity-0003",
      bundu: {
        verificationTier: 1,
        trustSignals: { reviewCount: 64, averageRating: 4.7, communityVouches: 31 },
        informalEconomy: { isInformal: true, operatingModel: "cooperative" },
      },
    },
    {
      _id: "smpl-product-0002",
      name: "Walking safari, three nights",
      slug: "walking-safari-three-nights",
      description:
        "Guided walking in Mana Pools with a licensed professional guide. All meals and park fees included.",
      productType: "experience",
      schemaOrgType: "Service",
      category: "Travel",
      sku: null,
      image: [img("safari", 800, 800)],
      offers: [
        {
          price: 1450,
          priceCurrency: "USD",
          availability: "LimitedAvailability",
          validThrough: "2026-10-31T00:00:00.000Z",
        },
      ],
      inventoryLevel: 4,
      status: "active",
      sellerEntityId: "smpl-entity-0002",
      bundu: { verificationTier: 3, trustSignals: { reviewCount: 88, averageRating: 4.9 } },
    },
    {
      _id: "smpl-product-0003",
      name: "Two-plate gas cooker",
      slug: "two-plate-gas-cooker",
      description: "Second-hand, working, collection from Bulawayo only.",
      productType: "physical_good",
      schemaOrgType: "IndividualProduct",
      category: "Appliances",
      sku: null,
      // Sold out with zero inventory — the branch a marketplace card must handle
      // and the one that is never open while you are building it.
      image: [img("cooker", 800, 800)],
      offers: [{ price: 35, priceCurrency: "USD", availability: "SoldOut" }],
      inventoryLevel: 0,
      status: "out_of_stock",
      sellerEntityId: "smpl-entity-0004",
      bundu: { verificationTier: 0, trustSignals: { reviewCount: 0, averageRating: null } },
    },
    {
      _id: "smpl-product-0004",
      name: "fundi tester",
      slug: "fundi-tester",
      description:
        "Run security scans, chaos injection and accessibility audits against your own app.",
      productType: "subscription",
      schemaOrgType: "Service",
      category: "Developer tools",
      sku: "FUNDI-TESTER",
      image: [],
      offers: [
        { price: 1, priceCurrency: "USD", availability: "InStock", name: "Monthly" },
        { price: 10, priceCurrency: "USD", availability: "InStock", name: "Annual" },
      ],
      inventoryLevel: null,
      status: "active",
      sellerEntityId: "smpl-entity-0002",
      bundu: { verificationTier: 3, trustSignals: { reviewCount: 6, averageRating: 4.5 } },
    },
    {
      _id: "smpl-product-0005",
      name: "Bakkie hire, per day",
      slug: "bakkie-hire-per-day",
      description: "One-tonne pickup, driver optional. Fuel not included. Deposit required.",
      productType: "rental",
      schemaOrgType: "Vehicle",
      category: "Transport",
      sku: "TM-BAKKIE-1T",
      image: [img("bakkie", 800, 800)],
      offers: [{ price: 60, priceCurrency: "USD", availability: "InStock" }],
      inventoryLevel: 2,
      status: "active",
      sellerEntityId: "smpl-entity-0004",
      bundu: {
        verificationTier: 1,
        trustSignals: { reviewCount: 9, averageRating: 4.2, yearsActive: 3 },
        informalEconomy: { isInformal: true, operatingModel: "individual", operatesAt: "mobile" },
      },
    },
  ],

  // ── Articles ──────────────────────────────────────────────────────────────
  articles: [
    {
      _id: "smpl-article-0001",
      headline: "Chikomba weavers open a second workshop after export orders double",
      slug: "chikomba-weavers-second-workshop",
      description:
        "The cooperative has taken on eleven new members and expects to reach a hundred baskets a month by September.",
      articleBody:
        'The Chikomba Weavers Cooperative has opened a second workshop in Sadza, funded entirely from retained earnings after two years of rising export orders.\n\nChair Nomsa Dube said the decision was made at a general meeting in March. "We agreed we would not borrow," she said. "We would wait until the orders were steady."',
      articleSection: "Business",
      datePublished: "2026-06-11T06:30:00.000Z",
      image: [img("weavers-article", 1200, 675)],
      inLanguage: "en",
      wordCount: 640,
      mediaOrganizationId: "smpl-entity-0005",
      publisherName: "Kubatana News",
      authorName: "Farai Chikwanha",
    },
    {
      _id: "smpl-article-0002",
      headline: "Mana Pools walking permits move online",
      slug: "mana-pools-permits-online",
      description: "Applications that took six weeks by post are now processed in four days.",
      articleBody:
        "Parks authorities have moved walking-safari permit applications to an online form.",
      articleSection: "Travel",
      datePublished: "2026-06-09T11:00:00.000Z",
      image: [img("permits-article", 1200, 675)],
      inLanguage: "en",
      wordCount: 310,
      mediaOrganizationId: "smpl-entity-0005",
      publisherName: "Kubatana News",
      authorName: "Farai Chikwanha",
    },
    {
      _id: "smpl-article-0003",
      headline: "Nhimbe returns to Chikomba",
      slug: "nhimbe-returns-to-chikomba",
      description: null,
      // No description, no image — the wire-copy case. A feed card that only
      // looks right with a hero image will look wrong for most of a real feed.
      articleBody:
        "Households across the district gathered for the first communal harvest in four seasons.",
      articleSection: "Community",
      datePublished: "2026-06-15T05:00:00.000Z",
      image: [],
      inLanguage: "en",
      wordCount: 180,
      mediaOrganizationId: "smpl-entity-0005",
      publisherName: "Kubatana News",
      authorName: null,
    },
    {
      _id: "smpl-article-0004",
      headline: "Kwedu kune nhimbe: kudzoka kwetsika yekubatsirana",
      slug: "kwedu-kune-nhimbe",
      description: "Nyaya yekudzoka kwetsika yenhimbe mumaruwa eChikomba.",
      // Shona. The type stack is Noto Sans specifically for African language
      // coverage (§7.2); a sample set that is entirely English never tests it.
      articleBody: "Mhuri dzakawanda dzakaungana mangwanani kuti dzibatsirane kukohwa chibage.",
      articleSection: "Community",
      datePublished: "2026-06-14T07:15:00.000Z",
      image: [img("nhimbe-article", 1200, 675)],
      inLanguage: "sn",
      wordCount: 420,
      mediaOrganizationId: "smpl-entity-0005",
      publisherName: "Kubatana News",
      authorName: "Farai Chikwanha",
    },
    {
      _id: "smpl-article-0005",
      headline: "Bulawayo Arts Festival postponed",
      slug: "bulawayo-arts-festival-postponed",
      description:
        "Organisers cite a venue booking clash; ticket holders will be refunded in full.",
      articleBody: "The festival will not go ahead in May as scheduled.",
      articleSection: "Arts",
      datePublished: "2026-04-22T14:40:00.000Z",
      image: [img("bulawayo-arts", 1200, 675)],
      inLanguage: "en",
      wordCount: 260,
      mediaOrganizationId: "smpl-entity-0005",
      publisherName: "Kubatana News",
      authorName: "Farai Chikwanha",
    },
  ],
}
