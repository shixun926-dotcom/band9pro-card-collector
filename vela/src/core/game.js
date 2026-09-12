import {
  CARDS,
  CARD_BY_ID,
  RARITY_BY_ID,
  RARITY_DEFS
} from "../data/cards.js";

export const STATE_VERSION = 1;
export const DAILY_EXERCISE_TARGET = 8000;
export const DRAW_SOURCES = Object.freeze(["login", "exercise"]);

const DRAW_SOURCE_SET = new Set(DRAW_SOURCES);
const TOTAL_RARITY_WEIGHT = RARITY_DEFS.reduce(
  (sum, rarity) => sum + rarity.weight,
  0
);
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createInitialState() {
  return {
    version: STATE_VERSION,
    day: null,
    loginClaimedOn: null,
    exerciseClaimedOn: null,
    exerciseValue: 0,
    tickets: {
      login: false,
      exercise: false
    },
    owned: {},
    totalDraws: 0
  };
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function validateDayKey(day) {
  if (typeof day !== "string" || !DAY_KEY_PATTERN.test(day)) {
    throw new TypeError("day must use YYYY-MM-DD");
  }
}

function validateRandomValue(value) {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("random value must be in [0, 1)");
  }
}

function validateSource(source) {
  if (!DRAW_SOURCE_SET.has(source)) {
    throw new TypeError(`unsupported draw source: ${source}`);
  }
}

export function normalizeState(state) {
  if (!state || state.version !== STATE_VERSION) {
    return createInitialState();
  }

  const initial = createInitialState();
  const owned =
    state.owned && typeof state.owned === "object" ? state.owned : {};

  return {
    ...initial,
    ...state,
    tickets: {
      ...initial.tickets,
      ...(state.tickets && typeof state.tickets === "object"
        ? state.tickets
        : {})
    },
    owned: { ...owned }
  };
}

export function rolloverToDay(state, day) {
  validateDayKey(day);
  const next = cloneState(normalizeState(state));

  if (next.day !== day) {
    next.day = day;
    next.exerciseValue = 0;
    next.tickets = {
      login: false,
      exercise: false
    };
  }

  return next;
}

export function claimDailyLogin(state, day) {
  const next = rolloverToDay(state, day);

  if (next.loginClaimedOn === day) {
    return {
      state: next,
      granted: false
    };
  }

  next.loginClaimedOn = day;
  next.tickets.login = true;

  return {
    state: next,
    granted: true
  };
}

export function recordExercise(
  state,
  day,
  value,
  target = DAILY_EXERCISE_TARGET
) {
  validateDayKey(day);

  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("exercise value must be a non-negative number");
  }

  if (!Number.isFinite(target) || target <= 0) {
    throw new RangeError("exercise target must be a positive number");
  }

  const next = rolloverToDay(state, day);
  next.exerciseValue = Math.max(next.exerciseValue, value);

  if (
    next.exerciseValue >= target &&
    next.exerciseClaimedOn !== day
  ) {
    next.exerciseClaimedOn = day;
    next.tickets.exercise = true;

    return {
      state: next,
      granted: true
    };
  }

  return {
    state: next,
    granted: false
  };
}

function rollRarity(randomValue) {
  let cursor = 0;
  const threshold = randomValue * TOTAL_RARITY_WEIGHT;

  for (const rarity of RARITY_DEFS) {
    cursor += rarity.weight;
    if (threshold < cursor) {
      return rarity.id;
    }
  }

  return RARITY_DEFS[RARITY_DEFS.length - 1].id;
}

export function drawCard(state, source, random = Math.random) {
  validateSource(source);

  const next = cloneState(normalizeState(state));

  if (!next.tickets[source]) {
    throw new Error(`draw ticket is not available: ${source}`);
  }

  const rarityRandom = Number(random());
  validateRandomValue(rarityRandom);
  const rarity = rollRarity(rarityRandom);

  const candidates = CARDS.filter((card) => card.rarity === rarity);
  const cardRandom = Number(random());
  validateRandomValue(cardRandom);
  const cardIndex = Math.min(
    Math.floor(cardRandom * candidates.length),
    candidates.length - 1
  );
  const card = candidates[cardIndex];
  const previousCount = next.owned[card.id] || 0;

  next.tickets[source] = false;
  next.owned[card.id] = previousCount + 1;
  next.totalDraws += 1;

  return {
    state: next,
    card,
    isNew: previousCount === 0,
    source
  };
}

export function getDailyStatus(
  state,
  target = DAILY_EXERCISE_TARGET
) {
  const normalized = normalizeState(state);

  return {
    login: Boolean(normalized.tickets.login),
    exercise: Boolean(normalized.tickets.exercise),
    exerciseValue: normalized.exerciseValue,
    exerciseTarget: target,
    exerciseProgress: Math.min(
      1,
      normalized.exerciseValue / target
    )
  };
}

export function getCollection(state) {
  const normalized = normalizeState(state);

  return CARDS.map((card) => {
    const count = normalized.owned[card.id] || 0;

    return {
      ...card,
      count,
      owned: count > 0,
      rarityName: RARITY_BY_ID[card.rarity].name,
      rarityColor: RARITY_BY_ID[card.rarity].color
    };
  });
}

export function getCollectionSummary(state) {
  const collection = getCollection(state);
  const byRarity = {};

  for (const rarity of RARITY_DEFS) {
    const cards = collection.filter(
      (card) => card.rarity === rarity.id
    );

    byRarity[rarity.id] = {
      owned: cards.filter((card) => card.owned).length,
      total: cards.length
    };
  }

  return {
    owned: collection.filter((card) => card.owned).length,
    total: collection.length,
    totalDraws: normalizeState(state).totalDraws,
    byRarity
  };
}

export function getCardDetail(state, cardId) {
  const card = CARD_BY_ID[cardId];

  if (!card) {
    return null;
  }

  const count = normalizeState(state).owned[cardId] || 0;

  return {
    ...card,
    count,
    owned: count > 0,
    rarityName: RARITY_BY_ID[card.rarity].name,
    rarityColor: RARITY_BY_ID[card.rarity].color
  };
}

export function serializeState(state) {
  return JSON.stringify(normalizeState(state));
}
