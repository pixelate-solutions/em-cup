import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { players, type Player } from "@/db/schema";

const GHIN_BASE_URL = "https://api2.ghin.com/api/v1";
const FIREBASE_SESSION_URL =
  "https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations";
const GOOGLE_API_KEY = "AIzaSyBxgTOAWxiud0HuaE5tN-5NTlzFnrtyz-I";
const CLIENT_SOURCE = "GHINcom";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

const SESSION_DEFAULTS = {
  appId: "1:884417644529:web:47fb315bc6c70242f72650",
  authVersion: "FIS_v2",
  fid: "fg6JfS0U01YmrelthLX9Iz",
  sdkVersion: "w:0.5.7",
};

const FIRST_NAME_ALIASES: Record<string, string[]> = {
  cj: ["Christopher", "Chris", "CJ"],
  chris: ["Chris", "Christopher"],
  christopher: ["Christopher", "Chris"],
  dan: ["Dan", "Daniel"],
  dom: ["Dom", "Dominic"],
  jim: ["Jim", "James"],
  james: ["James", "Jim"],
  john: ["John", "Johnathan", "Jonathan", "Jon"],
  johnathan: ["Johnathan", "Jonathan", "John", "Jon"],
  jon: ["Jon", "John", "Jonathan", "Johnathan"],
  jonathan: ["Jonathan", "Johnathan", "John", "Jon"],
  joey: ["Joey", "Joseph", "Joe"],
  joseph: ["Joseph", "Joey", "Joe"],
  matt: ["Matt", "Matthew"],
  michael: ["Michael", "Mike"],
  mike: ["Mike", "Michael"],
  nick: ["Nick", "Nicholas", "Nickolas", "Nicolas", "Nikolas"],
  nickolas: ["Nickolas", "Nicholas", "Nick", "Nicolas", "Nikolas"],
  nicolas: ["Nicolas", "Nicholas", "Nickolas", "Nick", "Nikolas"],
  nicholas: ["Nicholas", "Nick", "Nickolas", "Nicolas", "Nikolas"],
  nikolas: ["Nikolas", "Nicholas", "Nickolas", "Nicolas", "Nick"],
  rich: ["Rich", "Richard"],
  sal: ["Sal", "Salvatore", "Salvador"],
  walt: ["Walt", "Walter"],
};

const NAME_SUFFIXES = new Set([
  "2",
  "3",
  "4",
  "5",
  "ii",
  "iii",
  "iv",
  "v",
  "jr",
  "junior",
  "sr",
  "senior",
]);

const STATE_CODES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  newhampshire: "NH",
  newjersey: "NJ",
  newmexico: "NM",
  newyork: "NY",
  northcarolina: "NC",
  northdakota: "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  rhodeisland: "RI",
  southcarolina: "SC",
  southdakota: "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  westvirginia: "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

type GhinGolfer = {
  ghin: number;
  first_name: string;
  last_name: string;
  association_name?: string | null;
  handicap_index?: string | number | null;
  hi_value?: string | number | null;
  hi_display?: string | null;
  club_name?: string | null;
  country?: string | null;
  rev_date?: string | null;
  state?: string | null;
  status?: string | null;
  suffix?: string | null;
};

type GhinCandidate = {
  golfer: GhinGolfer;
  fromStateSearch: boolean;
};

export type GhinRefreshResult = {
  playerId: number;
  playerName: string;
  ok: boolean;
  handicapIndex: string | null;
  ghinNumber: string | null;
  message: string;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isGhinConfigured() {
  return Boolean(process.env.GHIN_USERNAME && process.env.GHIN_PASSWORD);
}

export async function refreshAllPlayerHandicaps() {
  const allPlayers = await db.select().from(players).where(eq(players.ghinAutoSync, true));
  const results: GhinRefreshResult[] = [];

  for (const player of allPlayers) {
    results.push(await refreshPlayerHandicap(player));
  }

  return results;
}

export async function refreshPlayerHandicapById(playerId: number) {
  const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player) throw new Error("Player not found");
  return refreshPlayerHandicap(player);
}

export async function refreshPlayerHandicap(player: Player): Promise<GhinRefreshResult> {
  if (!player.ghinAutoSync) {
    return {
      playerId: player.id,
      playerName: player.name,
      ok: false,
      handicapIndex: player.handicapIndex ?? null,
      ghinNumber: player.ghinNumber ?? null,
      message: "GHIN sync disabled",
    };
  }

  try {
    const golfer = await findGolferForPlayer(player);
    const handicap = normalizeHandicap(golfer.handicap_index ?? golfer.hi_value ?? golfer.hi_display);

    await db
      .update(players)
      .set({
        handicapIndex: handicap,
        ghinNumber: String(golfer.ghin),
        ghinState: normalizeState(player.ghinState),
        ghinCountry: normalizeCountry(golfer.country || player.ghinCountry),
        ghinClubName: golfer.club_name || null,
        ghinAssociationName: golfer.association_name || null,
        ghinLastFetchedAt: new Date(),
        ghinRevDate: golfer.rev_date ?? null,
        ghinStatus: "matched",
        ghinError: null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return {
      playerId: player.id,
      playerName: player.name,
      ok: true,
      handicapIndex: handicap,
      ghinNumber: String(golfer.ghin),
      message: `${golfer.first_name} ${golfer.last_name}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "GHIN refresh failed";
    await db
      .update(players)
      .set({
        ghinLastFetchedAt: new Date(),
        ghinStatus: "error",
        ghinError: message,
        updatedAt: new Date(),
      })
      .where(eq(players.id, player.id));

    return {
      playerId: player.id,
      playerName: player.name,
      ok: false,
      handicapIndex: player.handicapIndex ?? null,
      ghinNumber: player.ghinNumber ?? null,
      message,
    };
  }
}

export async function resolveCurrentHandicapsForPlayers(playerIds: number[]) {
  const uniqueIds = Array.from(new Set(playerIds));
  if (uniqueIds.length === 0) return new Map<number, string | null>();

  const currentPlayers = await db
    .select()
    .from(players)
    .where(and(inArray(players.id, uniqueIds), eq(players.ghinAutoSync, true)));
  const refreshed = new Map<number, string | null>();

  for (const player of currentPlayers) {
    const result = await refreshPlayerHandicap(player);
    refreshed.set(player.id, result.handicapIndex);
  }

  return refreshed;
}

async function findGolferForPlayer(player: Player) {
  if (!isGhinConfigured()) {
    throw new Error("GHIN_USERNAME and GHIN_PASSWORD are required");
  }

  if (player.ghinNumber?.trim()) {
    const golfer = await getGolferByGhinNumber(player.ghinNumber.trim());
    const desiredState = normalizeState(player.ghinState);
    if (desiredState && !golferMatchesState(golfer, desiredState)) {
      throw new Error(`GHIN number ${player.ghinNumber.trim()} is not in ${desiredState}`);
    }

    return golfer;
  }

  const name = splitPlayerName(player);
  const candidates = new Map<number, GhinCandidate>();

  for (const firstName of firstNameCandidates(name.firstName)) {
    const golferCandidates = await searchGolferCandidates({
      firstName,
      lastName: name.lastName,
      suffix: name.suffix,
      state: player.ghinState,
      country: player.ghinCountry,
    });

    for (const candidate of golferCandidates) {
      const existing = candidates.get(candidate.golfer.ghin);
      candidates.set(candidate.golfer.ghin, {
        golfer: candidate.golfer,
        fromStateSearch: Boolean(existing?.fromStateSearch || candidate.fromStateSearch),
      });
    }
  }

  return selectBestGolfer(Array.from(candidates.values()), player, name);
}

async function getGolferByGhinNumber(ghinNumber: string) {
  const golfers = await searchGlobalGolfers({
    golfer_id: ghinNumber,
    per_page: "1",
  });
  const golfer = golfers[0];
  if (!golfer) throw new Error(`No GHIN golfer found for ${ghinNumber}`);
  return golfer;
}

async function searchGolferCandidates({
  firstName,
  lastName,
  suffix,
  state,
  country,
}: {
  firstName: string;
  lastName: string;
  suffix: string | null;
  state: string | null;
  country: string | null;
}) {
  const stateValue = normalizeState(state) || undefined;
  const countryValues = countryCandidates(country);
  const lastNameVariants = lastNameSearchVariants(lastName, suffix);
  const searches: Array<Record<string, string | undefined>> = [];

  for (const lastNameVariant of lastNameVariants) {
    for (const countryValue of countryValues) {
      searches.push({
        first_name: firstName,
        last_name: lastNameVariant,
        state: stateValue,
        country: countryValue,
        per_page: "25",
      });
    }

    if (stateValue) {
      searches.push({
        first_name: firstName,
        last_name: lastNameVariant,
        state: undefined,
        country: countryValues[0],
        per_page: "25",
      });
    }

    searches.push({
      first_name: firstName,
      last_name: lastNameVariant,
      state: undefined,
      country: undefined,
      per_page: "25",
    });
  }

  const golfers = new Map<number, GhinCandidate>();
  for (const params of searches) {
    const results = await searchGlobalGolfers(params);
    const fromStateSearch = Boolean(params.state);

    for (const golfer of results) {
      const existing = golfers.get(golfer.ghin);
      golfers.set(golfer.ghin, {
        golfer,
        fromStateSearch: Boolean(existing?.fromStateSearch || fromStateSearch),
      });
    }

    if (golfers.size > 0) {
      break;
    }
  }

  return Array.from(golfers.values());
}

async function searchGlobalGolfers(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams({
    source: CLIENT_SOURCE,
    page: "1",
    per_page: "25",
    from_ghin: "true",
    sorting_criteria: "full_name",
    status: "Active",
    order: "asc",
  });

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value.trim() !== "") {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString().replace(/\+/g, "%20");
  const data = await ghinFetch<{ golfers?: GhinGolfer[] }>(`/golfers.json?${query}`);
  return data.golfers ?? [];
}

async function ghinFetch<T>(path: string, retry = true): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${GHIN_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      source: CLIENT_SOURCE,
    },
  });

  if ((response.status === 401 || response.status === 403) && retry) {
    cachedToken = null;
    return ghinFetch<T>(path, false);
  }

  if (!response.ok) {
    throw new Error(`GHIN request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const sessionResponse = await fetch(FIREBASE_SESSION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "x-goog-api-key": GOOGLE_API_KEY,
    },
    body: JSON.stringify(SESSION_DEFAULTS),
  });

  if (!sessionResponse.ok) {
    throw new Error(`GHIN session failed: ${sessionResponse.status} ${sessionResponse.statusText}`);
  }

  const session = (await sessionResponse.json()) as { token?: string; authToken?: { token?: string } };
  const firebaseToken = session.authToken?.token;
  if (!firebaseToken) throw new Error("GHIN session response did not include a token");

  const loginResponse = await fetch(`${GHIN_BASE_URL}/golfer_login.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      token: firebaseToken,
      user: {
        email_or_ghin: process.env.GHIN_USERNAME,
        password: process.env.GHIN_PASSWORD,
      },
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`GHIN login failed: ${loginResponse.status} ${loginResponse.statusText}`);
  }

  const login = (await loginResponse.json()) as {
    golfer_user?: { golfer_user_token?: string };
    token?: string;
  };
  const token = login.golfer_user?.golfer_user_token ?? login.token;
  if (!token) throw new Error("GHIN login response did not include a token");

  cachedToken = {
    token,
    expiresAt: decodeJwtExpiration(token) ?? now + 60 * 60 * 1000,
  };

  return token;
}

function selectBestGolfer(
  candidates: GhinCandidate[],
  player: Player,
  name: { firstName: string; lastName: string; suffix: string | null },
) {
  if (candidates.length === 0) {
    throw new Error("No GHIN found");
  }

  const firstNames = new Set(firstNameCandidates(name.firstName).map(normalizeName));
  const lastName = normalizeName(name.lastName);
  const suffix = normalizeSuffix(name.suffix);
  const desiredState = normalizeState(player.ghinState);
  const exactNameCandidates = candidates.filter(
    ({ golfer }) => golferMatchesLastName(golfer, lastName) && firstNames.has(normalizeName(golfer.first_name)),
  );

  if (desiredState) {
    const stateSearchMatches = exactNameCandidates.filter(({ fromStateSearch }) => fromStateSearch);
    const stateMatches = exactNameCandidates.filter(({ golfer }) => golferMatchesState(golfer, desiredState));
    const constrainedMatches = uniqueCandidates([...stateMatches, ...stateSearchMatches]);

    if (suffix) {
      const stateSuffixMatches = constrainedMatches.filter(({ golfer }) => golferMatchesSuffix(golfer, suffix));
      if (stateSuffixMatches.length === 1) {
        return stateSuffixMatches[0].golfer;
      }
    }

    if (constrainedMatches.length === 1) {
      return constrainedMatches[0].golfer;
    }

    if (constrainedMatches.length === 0) {
      throw new Error(`No GHIN found in ${desiredState}`);
    }

    throw new Error(`Multiple GHINs found in ${desiredState}; add GHIN number`);
  }

  if (suffix) {
    const suffixMatches = exactNameCandidates.filter(({ golfer }) => golferMatchesSuffix(golfer, suffix));
    if (suffixMatches.length === 1) {
      return suffixMatches[0].golfer;
    }
  }

  const scored = candidates
    .map(({ golfer, fromStateSearch }) => {
      let score = 0;
      if (golferMatchesLastName(golfer, lastName)) score += 50;
      if (firstNames.has(normalizeName(golfer.first_name))) score += 35;
      if (suffix && golferMatchesSuffix(golfer, suffix)) score += 30;
      if (desiredState && (fromStateSearch || golferMatchesState(golfer, desiredState))) score += 20;
      if (golfer.status === "Active") score += 5;
      return { golfer, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 80) {
    throw new Error("No confident GHIN found");
  }

  if (second && best.score === second.score) {
    throw new Error("Multiple GHINs found; add GHIN number or state");
  }

  return best.golfer;
}

function splitPlayerName(player: Player) {
  const rawParts = player.name
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[.,]/g, ""))
    .filter(Boolean);
  const suffix = normalizeSuffix(rawParts.at(-1) ?? null);
  const parts = suffix ? rawParts.slice(0, -1) : rawParts;

  return {
    firstName: parts[0] || player.name,
    lastName: parts.at(-1) || player.name,
    suffix,
  };
}

function uniqueCandidates(candidates: GhinCandidate[]) {
  return Array.from(new Map(candidates.map((candidate) => [candidate.golfer.ghin, candidate])).values());
}

function lastNameSearchVariants(lastName: string, suffix: string | null) {
  if (!suffix) return [lastName];
  return [`${lastName} ${formatSuffixForSearch(suffix)}`, lastName];
}

function firstNameCandidates(firstName: string) {
  const normalized = normalizeName(firstName);
  return Array.from(new Set([firstName, ...(FIRST_NAME_ALIASES[normalized] ?? [])])).filter(Boolean);
}

function countryCandidates(country: string | null) {
  const normalized = normalizeCountry(country);
  if (!normalized || normalized === "US" || normalized === "USA" || normalized === "UNITED STATES") {
    return ["USA", "US", undefined];
  }

  return [normalized, undefined];
}

function normalizeCountry(country: string | null | undefined) {
  const normalized = country?.trim().toUpperCase();
  if (!normalized || normalized === "UNITED STATES" || normalized === "USA") return "US";
  return normalized.slice(0, 8);
}

function golferMatchesLastName(golfer: GhinGolfer, desiredLastName: string) {
  const normalizedLastName = normalizeName(golfer.last_name);
  return normalizedLastName === desiredLastName || normalizedLastName.startsWith(desiredLastName);
}

function golferMatchesSuffix(golfer: GhinGolfer, desiredSuffix: string) {
  const suffix = normalizeSuffix(golfer.suffix);
  if (suffix === desiredSuffix) return true;

  const normalizedLastName = normalizeName(golfer.last_name);
  return normalizedLastName.endsWith(desiredSuffix);
}

function golferMatchesState(golfer: GhinGolfer, desiredState: string) {
  if (normalizeState(golfer.state) === desiredState) return true;

  const stateName = stateNameForCode(desiredState);
  const searchableFields = [golfer.state, golfer.association_name, golfer.club_name]
    .filter((value): value is string => Boolean(value))
    .map(normalizeName);

  return searchableFields.some((field) => {
    if (field === normalizeName(desiredState)) return true;
    return stateName ? field.includes(normalizeName(stateName)) : false;
  });
}

function normalizeState(state: string | null | undefined) {
  const trimmed = state?.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;

  const leadingCode = upper.match(/^[A-Z]{2}\b/)?.[0];
  if (leadingCode && Object.values(STATE_CODES).includes(leadingCode)) return leadingCode;

  const normalized = normalizeName(trimmed);
  const exact = STATE_CODES[normalized];
  if (exact) return exact;

  const containsStateName = Object.entries(STATE_CODES).find(([name]) => normalized.includes(name));
  if (containsStateName) return containsStateName[1];

  return upper.slice(0, 8);
}

function stateNameForCode(code: string) {
  const found = Object.entries(STATE_CODES).find(([, value]) => value === code);
  return found?.[0] ?? null;
}

function normalizeSuffix(value: string | null | undefined) {
  const normalized = value ? normalizeName(value) : "";
  if (!normalized || !NAME_SUFFIXES.has(normalized)) return null;

  if (normalized === "2") return "ii";
  if (normalized === "3") return "iii";
  if (normalized === "4") return "iv";
  if (normalized === "5") return "v";
  if (normalized === "junior") return "jr";
  if (normalized === "senior") return "sr";

  return normalized;
}

function formatSuffixForSearch(suffix: string) {
  if (suffix === "jr") return "Jr";
  if (suffix === "sr") return "Sr";
  return suffix.toUpperCase();
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeHandicap(value: string | number | null | undefined) {
  if (value == null) return null;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed)) return null;
  return parsed.toFixed(1);
}

function decodeJwtExpiration(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}
