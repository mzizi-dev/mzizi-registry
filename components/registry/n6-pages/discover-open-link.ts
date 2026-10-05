/**
 * The canonical "Open in Mukoko" link: `https://mukoko.com/open/<service>/<id>`.
 *
 * One https URL per item, for every Mukoko service. It is a universal link:
 * the Mukoko apps claim `mukoko.com/open/*` (iOS universal links, Android app
 * links), so where the app is installed the link opens the item in it. Where
 * it is not, the resolver in `mukoko-dev/super-app-web` (`/open/*`) redirects
 * a desktop browser or a crawler to the item's public page (the web app for
 * an item with none) and gives a phone a choice: "Open in the Mukoko app" or
 * "Continue on the web". Never a bare `mukoko://` scheme,
 * which does nothing for someone without the app.
 *
 * Framework-free: the Astro and React Discover components both use it
 * (OpenInApp, DetailActions), and so can a server that fills a shell.
 *
 * Mzizi Discover Standard (contracts/discover/open-in-app).
 */

/** The origin every "Open in Mukoko" link starts with. */
export const MUKOKO_OPEN_ORIGIN = "https://mukoko.com";

/**
 * The Mukoko services an item can be opened in, as their `/open/<service>/`
 * segment. The same table as the resolver's (`crates/links` in
 * mukoko-dev/super-app-web): `places` is Mukoko Kweli, and a `profile` id is
 * a handle without the `@`.
 */
export const MUKOKO_SERVICES = [
  "news",
  "events",
  "weather",
  "circles",
  "places",
  "lingo",
  "profile",
] as const;

export type MukokoService = (typeof MUKOKO_SERVICES)[number];

/** Whether a string names a Mukoko service. */
export function isMukokoService(value: string): value is MukokoService {
  return (MUKOKO_SERVICES as readonly string[]).includes(value);
}

/**
 * The universal link that opens one item in Mukoko:
 * `openInMukokoUrl("circles", "harare-runners")` is
 * `https://mukoko.com/open/circles/harare-runners`. The id is
 * percent-encoded, so it is always one path segment.
 *
 * Throws a RangeError for a service that is not one of MUKOKO_SERVICES, or
 * an empty id: a broken "Open in Mukoko" link is a build error, not a 404.
 */
export function openInMukokoUrl(service: MukokoService, id: string): string {
  if (!isMukokoService(service)) {
    throw new RangeError(
      `openInMukokoUrl: "${String(service)}" is not a Mukoko service (${MUKOKO_SERVICES.join(", ")})`,
    );
  }
  if (typeof id !== "string" || id.trim() === "") {
    throw new RangeError(`openInMukokoUrl: an empty id for ${service}`);
  }
  return `${MUKOKO_OPEN_ORIGIN}/open/${service}/${encodeURIComponent(id)}`;
}
