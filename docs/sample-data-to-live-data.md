# From sample data to live data

Sample records stay authored in git. This is the missing half: how to point a
component that renders a sample at the real MongoDB collection behind it.

---

## 1. Why this is short

Because the mapping is already done. `lib/samples/types.ts` mirrors the production
MongoDB validators **field for field**, so the document a component was built
against and the document in your cluster are the same shape:

| Sample type     | Production collection | Notes                                         |
| --------------- | --------------------- | --------------------------------------------- |
| `SamplePlace`   | `places.places`       | Read `places_public` if the surface is public |
| `SampleEntity`  | `entity.entities`     | Sellers, orgs, family entities                |
| `SamplePerson`  | `identity.persons`    | `_id` IS the OIDC `sub`                       |
| `SampleEvent`   | `events.events`       |                                               |
| `SampleProduct` | `commerce.products`   |                                               |
| `SampleArticle` | `news.articles`       |                                               |

That correspondence is the whole point of curating the samples rather than
generating fixtures: getting a preview working and getting an integration working
stop being two jobs.

**For actual data the platform uses MongoDB, not Supabase.**

---

## 2. The swap, concretely

In the playground a component gets its props from `lib/samples/resolve.ts`, which
binds prop names and declared types to records in `lib/samples/data.ts`. In your
app you skip the resolver entirely — it exists to _guess_ a binding, and you know
yours.

```ts
// Preview (this repo, no database):
import { sampleData } from "@/lib/samples/data"
<NyuchiPlaceCard {...sampleData.places[0]} />

// Your app (real driver, same shape):
const place = await db.collection("places").findOne({ _id: id })
<NyuchiPlaceCard {...place} />
```

There is no adapter in between, and that is the deliverable. If you find yourself
writing one, the component and the validator have drifted — say so on an issue
rather than papering over it locally.

---

## 3. Querying the samples as if they were live

`pnpm samples:push` projects `lib/samples/data.ts` into a MongoDB database called
`mzizi_samples`, in the production document shape. Point a real driver at it and
develop against real queries before you have real data:

```ts
const client = new MongoClient(process.env.MONGODB_URI!)
const places = client.db("mzizi_samples").collection("places")
const nearby = await places.find({ "bundu.verificationTier": { $gte: 1 } }).toArray()
```

Two rules about that database:

- **Git is the source. Mongo is the projection.** Editing a document in
  `mzizi_samples` directly works right up until the next `samples:push`
  overwrites it. Author in `lib/samples/data.ts`.
- **The site does not read it.** 1,179 pages prerender from the file, so a Mongo
  outage can never empty the playground. The push exists so that _you_ can use a
  real driver, not so that mzizi.dev can.

---

## 4. What changes when the data is real

The samples are chosen to break things; production data is not. Four differences
that will show up the first time you swap:

1. **Most records are sparse.** Measured, not assumed: `places.places` holds 15,359
   documents, **38** have a description and **zero** have `media`. They are bare
   OSM name-and-geometry imports. A card that looks good in preview will render as
   a grey box with a name. The empty-state branches exist for this — make sure you
   are actually rendering them.
2. **Verification tier is mostly 0.** The sample set spans 0→3 deliberately; real
   community-reported records sit at the bottom. Tier 0 → 1 is the agent
   write-cliff, and a UI that only ever styled tier 3 will look wrong at scale.
3. **Some fields must not leave the cluster.** `places_public` exists as a view
   precisely because production records are real people and unverified community
   reports. If your surface is public, read the view, not the collection.
4. **Dates are live.** The sample set is deliberately frozen against `SAMPLE_NOW`
   with no clock reads, because a fixture that changes between two renders breaks
   static prerendering and makes a failing test unreproducible. Your data has none
   of that protection — anything relative ("2 days ago") needs a stable reference
   passed in, not a `Date.now()` inside the component.

---

## 5. Which way each thing is authored

The test is _who edits it_:

|                                               | Where                       | Why                                                                                                                      |
| --------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Sample records**                            | git (`lib/samples/data.ts`) | Someone writes them and someone reviews them. The reason a place has no cover image is a decision recorded in a comment. |
| **Domain data**                               | MongoDB                     | 15,359 places, 23,231 articles. Nobody hand-edits those in a pull request.                                               |
| **Component source**                          | git                         | §8.3                                                                                                                     |
| **Component metadata**                        | `registry.json` in git      | §15.1                                                                                                                    |
| **Version history, telemetry, the issue log** | Supabase                    | Machine-written, append-only                                                                                             |

Sample data being authored is not a reversal of "domain data lives in MongoDB".
They are different kinds of thing, and the split holds in both directions.
