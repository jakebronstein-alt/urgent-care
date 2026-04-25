export type Borough = "manhattan" | "brooklyn" | "queens" | "bronx" | "staten-island";

export interface BoroughInfo {
  borough: Borough;
  label: string;
  /** stateSlug + citySlug pairs that map to this borough in our DB */
  dbCities: { stateSlug: string; citySlug: string }[];
}

export const BOROUGH_INFO: Record<Borough, BoroughInfo> = {
  manhattan: {
    borough: "manhattan",
    label: "Manhattan",
    dbCities: [{ stateSlug: "ny", citySlug: "new-york" }],
  },
  brooklyn: {
    borough: "brooklyn",
    label: "Brooklyn",
    dbCities: [{ stateSlug: "ny", citySlug: "brooklyn" }],
  },
  queens: {
    borough: "queens",
    label: "Queens",
    dbCities: [
      { stateSlug: "ny", citySlug: "astoria" },
      { stateSlug: "ny", citySlug: "flushing" },
      { stateSlug: "ny", citySlug: "jamaica" },
    ],
  },
  bronx: {
    borough: "bronx",
    label: "The Bronx",
    dbCities: [{ stateSlug: "ny", citySlug: "bronx" }],
  },
  "staten-island": {
    borough: "staten-island",
    label: "Staten Island",
    dbCities: [{ stateSlug: "ny", citySlug: "staten-island" }],
  },
};

// ── Zip code → borough ─────────────────────────────────────────────────────

export function zipToBorough(zip: string): Borough | null {
  const n = parseInt(zip.trim(), 10);
  if (isNaN(n)) return null;
  if (n >= 10001 && n <= 10282) return "manhattan";
  if (n >= 10301 && n <= 10314) return "staten-island";
  if (n >= 10451 && n <= 10475) return "bronx";
  if (n >= 11201 && n <= 11256) return "brooklyn";
  if (n >= 11101 && n <= 11436) return "queens";
  return null;
}

// ── Neighborhood → borough ─────────────────────────────────────────────────

const NEIGHBORHOOD_MAP: Record<string, Borough> = {
  // Manhattan
  "upper west side": "manhattan",
  "upper east side": "manhattan",
  "midtown": "manhattan",
  "midtown west": "manhattan",
  "midtown east": "manhattan",
  "chelsea": "manhattan",
  "hell's kitchen": "manhattan",
  "hells kitchen": "manhattan",
  "clinton": "manhattan",
  "greenwich village": "manhattan",
  "west village": "manhattan",
  "east village": "manhattan",
  "lower east side": "manhattan",
  "les": "manhattan",
  "soho": "manhattan",
  "noho": "manhattan",
  "nolita": "manhattan",
  "tribeca": "manhattan",
  "financial district": "manhattan",
  "fidi": "manhattan",
  "battery park": "manhattan",
  "battery park city": "manhattan",
  "harlem": "manhattan",
  "east harlem": "manhattan",
  "spanish harlem": "manhattan",
  "el barrio": "manhattan",
  "washington heights": "manhattan",
  "inwood": "manhattan",
  "morningside heights": "manhattan",
  "hamilton heights": "manhattan",
  "murray hill": "manhattan",
  "kip's bay": "manhattan",
  "kips bay": "manhattan",
  "gramercy": "manhattan",
  "gramercy park": "manhattan",
  "flatiron": "manhattan",
  "union square": "manhattan",
  "nomad": "manhattan",
  "little italy": "manhattan",
  "chinatown": "manhattan",
  "two bridges": "manhattan",
  "stuyvesant town": "manhattan",
  "stuy town": "manhattan",
  "lenox hill": "manhattan",
  "yorkville": "manhattan",
  "carnegie hill": "manhattan",
  "manhattan": "manhattan",
  "new york": "manhattan",
  "nyc": "manhattan",

  // Brooklyn
  "park slope": "brooklyn",
  "williamsburg": "brooklyn",
  "brooklyn heights": "brooklyn",
  "dumbo": "brooklyn",
  "bushwick": "brooklyn",
  "crown heights": "brooklyn",
  "flatbush": "brooklyn",
  "sunset park": "brooklyn",
  "bay ridge": "brooklyn",
  "bensonhurst": "brooklyn",
  "coney island": "brooklyn",
  "brighton beach": "brooklyn",
  "greenpoint": "brooklyn",
  "bed-stuy": "brooklyn",
  "bedford stuyvesant": "brooklyn",
  "bedford-stuyvesant": "brooklyn",
  "cobble hill": "brooklyn",
  "carroll gardens": "brooklyn",
  "red hook": "brooklyn",
  "prospect heights": "brooklyn",
  "boerum hill": "brooklyn",
  "fort greene": "brooklyn",
  "clinton hill": "brooklyn",
  "flatlands": "brooklyn",
  "canarsie": "brooklyn",
  "east new york": "brooklyn",
  "brownsville": "brooklyn",
  "borough park": "brooklyn",
  "sheepshead bay": "brooklyn",
  "marine park": "brooklyn",
  "ditmas park": "brooklyn",
  "kensington": "brooklyn",
  "windsor terrace": "brooklyn",
  "prospect lefferts gardens": "brooklyn",
  "east flatbush": "brooklyn",
  "midwood": "brooklyn",
  "gravesend": "brooklyn",
  "dyker heights": "brooklyn",
  "downtown brooklyn": "brooklyn",
  "brooklyn": "brooklyn",

  // Queens
  "astoria": "queens",
  "long island city": "queens",
  "lic": "queens",
  "sunnyside": "queens",
  "woodside": "queens",
  "jackson heights": "queens",
  "elmhurst": "queens",
  "corona": "queens",
  "flushing": "queens",
  "bayside": "queens",
  "jamaica": "queens",
  "forest hills": "queens",
  "rego park": "queens",
  "kew gardens": "queens",
  "howard beach": "queens",
  "rockaway": "queens",
  "far rockaway": "queens",
  "ridgewood": "queens",
  "glendale": "queens",
  "maspeth": "queens",
  "middle village": "queens",
  "fresh meadows": "queens",
  "holliswood": "queens",
  "hollis": "queens",
  "st. albans": "queens",
  "springfield gardens": "queens",
  "south ozone park": "queens",
  "ozone park": "queens",
  "richmond hill": "queens",
  "woodhaven": "queens",
  "queens": "queens",

  // Bronx
  "fordham": "bronx",
  "riverdale": "bronx",
  "mott haven": "bronx",
  "hunts point": "bronx",
  "belmont": "bronx",
  "pelham bay": "bronx",
  "throgs neck": "bronx",
  "eastchester": "bronx",
  "wakefield": "bronx",
  "co-op city": "bronx",
  "coop city": "bronx",
  "morris park": "bronx",
  "norwood": "bronx",
  "highbridge": "bronx",
  "morrisania": "bronx",
  "tremont": "bronx",
  "kingsbridge": "bronx",
  "spuyten duyvil": "bronx",
  "port morris": "bronx",
  "soundview": "bronx",
  "concourse": "bronx",
  "grand concourse": "bronx",
  "the bronx": "bronx",
  "bronx": "bronx",

  // Staten Island
  "st. george": "staten-island",
  "saint george": "staten-island",
  "new dorp": "staten-island",
  "tottenville": "staten-island",
  "great kills": "staten-island",
  "stapleton": "staten-island",
  "snug harbor": "staten-island",
  "port richmond": "staten-island",
  "west brighton": "staten-island",
  "new springville": "staten-island",
  "richmond": "staten-island",
  "staten island": "staten-island",
};

export function neighborhoodToBorough(query: string): Borough | null {
  return NEIGHBORHOOD_MAP[query.toLowerCase().trim()] ?? null;
}

// ── Main resolver ──────────────────────────────────────────────────────────

export type LocationResult =
  | { type: "nyc"; borough: Borough; info: BoroughInfo }
  | { type: "out-of-area" }
  | { type: "empty" };

export function resolveLocation(raw: string): LocationResult {
  const q = raw.trim();
  if (!q) return { type: "empty" };

  // Zip code (5 digits)
  if (/^\d{5}$/.test(q)) {
    const borough = zipToBorough(q);
    if (borough) return { type: "nyc", borough, info: BOROUGH_INFO[borough] };
    return { type: "out-of-area" };
  }

  // Neighborhood / borough name
  const borough = neighborhoodToBorough(q);
  if (borough) return { type: "nyc", borough, info: BOROUGH_INFO[borough] };

  return { type: "out-of-area" };
}
