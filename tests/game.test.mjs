import assert from "node:assert/strict";
import test from "node:test";
import {
  claimDailyLogin,
  createInitialState,
  drawCard,
  getCollectionSummary,
  recordExercise,
  rolloverToDay,
  serializeState
} from "../app/core/game.js";

const DAY_ONE = "2026-09-12";
const DAY_TWO = "2026-09-13";

function randomSequence(values) {
  let index = 0;

  return () => {
    const value = values[index];
    index += 1;

    if (value === undefined) {
      throw new Error("random sequence exhausted");
    }

    return value;
  };
}

function stateWithTicket(source) {
  const state = rolloverToDay(createInitialState(), DAY_ONE);

  state.tickets = {
    login: source === "login",
    exercise: source === "exercise"
  };

  return state;
}

test("daily login grants only one ticket per day", () => {
  const first = claimDailyLogin(createInitialState(), DAY_ONE);
  const second = claimDailyLogin(first.state, DAY_ONE);

  assert.equal(first.granted, true);
  assert.equal(first.state.tickets.login, true);
  assert.equal(second.granted, false);
  assert.equal(second.state.tickets.login, true);
});

test("new day discards unspent tickets and allows a new login", () => {
  const first = claimDailyLogin(createInitialState(), DAY_ONE);
  const dayTwo = rolloverToDay(first.state, DAY_TWO);
  const second = claimDailyLogin(dayTwo, DAY_TWO);

  assert.equal(dayTwo.tickets.login, false);
  assert.equal(second.granted, true);
  assert.equal(second.state.loginClaimedOn, DAY_TWO);
});

test("exercise grants one ticket after reaching its target", () => {
  const below = recordExercise(
    createInitialState(),
    DAY_ONE,
    7999
  );
  const reached = recordExercise(below.state, DAY_ONE, 8000);
  const repeated = recordExercise(reached.state, DAY_ONE, 12000);

  assert.equal(below.granted, false);
  assert.equal(reached.granted, true);
  assert.equal(reached.state.tickets.exercise, true);
  assert.equal(repeated.granted, false);
});

test("draw consumes exactly one ticket", () => {
  const state = stateWithTicket("login");
  const result = drawCard(
    state,
    "login",
    randomSequence([0, 0])
  );

  assert.equal(result.card.rarity, "N");
  assert.equal(result.state.tickets.login, false);
  assert.throws(
    () => drawCard(result.state, "login", randomSequence([0, 0])),
    /ticket is not available/
  );
});

test("rarity thresholds map to the configured probability bands", () => {
  const r = drawCard(
    stateWithTicket("login"),
    "login",
    randomSequence([0.6, 0])
  );
  const sr = drawCard(
    stateWithTicket("login"),
    "login",
    randomSequence([0.9, 0])
  );
  const ssr = drawCard(
    stateWithTicket("login"),
    "login",
    randomSequence([0.99, 0])
  );

  assert.equal(r.card.rarity, "R");
  assert.equal(sr.card.rarity, "SR");
  assert.equal(ssr.card.rarity, "SSR");
});

test("repeated draws increment count and report a duplicate", () => {
  const first = drawCard(
    stateWithTicket("login"),
    "login",
    randomSequence([0, 0])
  );
  const second = drawCard(
    {
      ...first.state,
      tickets: {
        login: true,
        exercise: false
      }
    },
    "login",
    randomSequence([0, 0])
  );

  assert.equal(first.isNew, true);
  assert.equal(second.isNew, false);
  assert.equal(second.state.owned[first.card.id], 2);
  assert.equal(second.state.totalDraws, 2);
});

test("collection summary tracks unique cards and source totals", () => {
  const result = drawCard(
    stateWithTicket("exercise"),
    "exercise",
    randomSequence([0.99, 0])
  );
  const summary = getCollectionSummary(result.state);

  assert.equal(summary.owned, 1);
  assert.equal(summary.total, 24);
  assert.equal(summary.totalDraws, 1);
  assert.equal(summary.byRarity.SSR.owned, 1);
});

test("serialized state stays small after all cards are collected", () => {
  const state = createInitialState();

  state.owned = {
    n01: 99, n02: 99, n03: 99, n04: 99, n05: 99, n06: 99,
    n07: 99, n08: 99, n09: 99, n10: 99, n11: 99, n12: 99,
    r01: 99, r02: 99, r03: 99, r04: 99, r05: 99, r06: 99,
    r07: 99, sr01: 99, sr02: 99, sr03: 99, sr04: 99, ssr01: 99
  };
  state.totalDraws = 999999;

  assert.ok(Buffer.byteLength(serializeState(state)) < 4096);
});
