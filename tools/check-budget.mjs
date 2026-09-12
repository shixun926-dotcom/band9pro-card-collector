import {
  existsSync,
  readdirSync,
  statSync
} from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = fileURLToPath(new URL("../app", import.meta.url));
const CARD_ROOT = resolve(APP_ROOT, "assets/cards");
const PACKAGE_LIMIT = 1024 * 1024;
const CARD_LIMIT = 50 * 1024;
const CARD_RECOMMENDED = 35 * 1024;

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
        relativePath: relative(APP_ROOT, absolutePath).replaceAll(
          "\\",
          "/"
        ),
        size: stats.size
      });
    }
  }

  return files;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

if (!existsSync(CARD_ROOT)) {
  console.error("Card asset directory is missing.");
  process.exitCode = 1;
} else {
  const files = walk(APP_ROOT);
  const cardFiles = files.filter((file) =>
    file.relativePath.startsWith("assets/cards/")
  );
  const packageSize = files.reduce((sum, file) => sum + file.size, 0);
  const cardSize = cardFiles.reduce((sum, file) => sum + file.size, 0);
  const averageCardSize =
    cardFiles.length === 0 ? 0 : cardSize / cardFiles.length;
  const largestCard = cardFiles.reduce(
    (current, file) => (file.size > current.size ? file : current),
    { relativePath: "-", size: 0 }
  );
  const oversizedCards = cardFiles.filter(
    (file) => file.size > CARD_LIMIT
  );
  const warningCards = cardFiles.filter(
    (file) => file.size > CARD_RECOMMENDED
  );

  console.log(`Package root: ${APP_ROOT}`);
  console.log(
    `Package size: ${formatKb(packageSize)} / ${formatKb(PACKAGE_LIMIT)}`
  );
  console.log(`Card count: ${cardFiles.length}`);
  console.log(`Card assets: ${formatKb(cardSize)}`);
  console.log(`Average card: ${formatKb(averageCardSize)}`);
  console.log(
    `Largest card: ${largestCard.relativePath} ${formatKb(
      largestCard.size
    )}`
  );

  if (packageSize > PACKAGE_LIMIT) {
    console.error("Package exceeds the 1 MB hard limit.");
    process.exitCode = 1;
  }

  if (cardFiles.length === 0) {
    console.error("No card assets were found.");
    process.exitCode = 1;
  }

  if (oversizedCards.length > 0) {
    console.error(
      `Cards over 50 KB: ${oversizedCards
        .map((file) => file.relativePath)
        .join(", ")}`
    );
    process.exitCode = 1;
  }

  if (warningCards.length > 0) {
    console.warn(
      `Cards above the recommended 35 KB: ${warningCards
        .map((file) => file.relativePath)
        .join(", ")}`
    );
  }

  if (process.exitCode !== 1) {
    console.log("Budget check passed.");
  }
}
