import assert from "node:assert/strict";
import {
  existsSync,
  readdirSync,
  statSync
} from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CARDS } from "../app/data/cards.js";

const APP_ROOT = fileURLToPath(new URL("../app", import.meta.url));
const CARD_ROOT = resolve(APP_ROOT, "assets/cards");

function walk(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const absolutePath = resolve(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...walk(absolutePath));
    } else {
      files.push({
        path: absolutePath,
        size: stats.size
      });
    }
  }

  return files;
}

test("all configured cards have an asset under 50 KB", () => {
  assert.equal(existsSync(CARD_ROOT), true);

  for (const card of CARDS) {
    const assetPath = resolve(APP_ROOT, card.asset);

    assert.equal(existsSync(assetPath), true, card.asset);
    assert.ok(statSync(assetPath).size < 50 * 1024, card.asset);
  }
});

test("the app package stays under 1 MB", () => {
  const totalSize = walk(APP_ROOT).reduce(
    (sum, file) => sum + file.size,
    0
  );

  assert.ok(totalSize < 1024 * 1024, `${totalSize} bytes`);
});
