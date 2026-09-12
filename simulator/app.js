import {
  claimDailyLogin,
  createInitialState,
  drawCard,
  getCardDetail,
  getCollection,
  getCollectionSummary,
  getDailyStatus,
  normalizeState,
  recordExercise
} from "../app/core/game.js";
import { getLocalDayKey } from "../app/core/runtime.js";

const STORAGE_KEY = "starcard_simulator_state_v1";
const app = document.querySelector("#app");
const addStepsButton = document.querySelector("#add-steps-button");
const resetButton = document.querySelector("#reset-button");

let screen = "home";
let state = loadState();
let reveal = null;
let selectedCardId = null;

function loadState() {
  let saved = null;

  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    saved = null;
  }

  const normalized = normalizeState(saved);
  const result = claimDailyLogin(normalized, getLocalDayKey());

  localStorage.setItem(STORAGE_KEY, JSON.stringify(result.state));
  return result.state;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function homeTemplate() {
  const summary = getCollectionSummary(state);
  const status = getDailyStatus(state);
  const availableCount =
    Number(status.login) + Number(status.exercise);
  const exercisePercent = Math.round(status.exerciseProgress * 100);

  return `
    <div class="app-page">
      <header class="app-topbar">
        <div>
          <h1 class="app-title">星卡集</h1>
          <span class="app-eyebrow">DAILY COLLECTION</span>
        </div>
        <div class="app-progress">
          ${summary.owned}/${summary.total}
        </div>
      </header>
      <div class="app-content">
        <div class="app-hero">
          <img src="../app/assets/cards/ssr01.png" alt="">
          <div class="app-hero-copy">
            <span>今日卡池</span>
            <strong>收集星象</strong>
            <small>${summary.totalDraws} 次抽取</small>
          </div>
        </div>
        <div class="app-section-title">
          <strong>今日机会</strong>
          <span>${availableCount} 次可用</span>
        </div>
        ${taskTemplate({
          number: "01",
          title: "登录机会",
          available: status.login,
          meta: status.login ? "今日已获得一次抽卡" : "今日机会已使用",
          source: "login"
        })}
        ${taskTemplate({
          number: "02",
          title: "运动机会",
          available: status.exercise,
          meta: status.exercise
            ? "目标已达成"
            : `${status.exerciseValue}/${status.exerciseTarget} 步`,
          source: "exercise",
          progress: exercisePercent
        })}
      </div>
      ${navTemplate("home")}
      ${revealTemplate()}
    </div>
  `;
}

function taskTemplate(options) {
  const progress =
    options.progress === undefined
      ? ""
      : `
        <div class="task-progress">
          <span style="width: ${options.progress}%"></span>
        </div>
      `;

  return `
    <div class="task-row ${options.available ? "" : "done"}">
      <div class="task-number">${options.number}</div>
      <div class="task-copy">
        <strong>${options.title}</strong>
        <span>${options.meta}</span>
        ${progress}
      </div>
      ${
        options.available
          ? `
            <button
              class="task-button"
              type="button"
              data-action="draw"
              data-source="${options.source}"
            >
              抽取
            </button>
          `
          : ""
      }
    </div>
  `;
}

function collectionTemplate() {
  const collection = getCollection(state);
  const summary = getCollectionSummary(state);

  return `
    <div class="app-page">
      <header class="app-topbar">
        <button class="round-button" type="button" data-action="home">‹</button>
        <h1 class="app-title" style="font-size: 18px">图鉴</h1>
        <div class="app-progress">${summary.owned}/${summary.total}</div>
      </header>
      <div class="app-content">
        <div class="collection-grid">
          ${collection
            .map(
              (card) => `
                <button
                  class="collection-item ${card.owned ? "" : "locked"}"
                  type="button"
                  data-action="detail"
                  data-card-id="${card.id}"
                >
                  <span class="collection-thumb rarity-${card.rarity}">
                    <img src="../app/${card.asset}" alt="">
                    ${
                      card.count > 1
                        ? `<span class="duplicate-count">x${card.count}</span>`
                        : ""
                    }
                  </span>
                  <span>${card.owned ? card.name : "未获得"}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      ${navTemplate("collection")}
    </div>
  `;
}

function detailTemplate() {
  const card = getCardDetail(state, selectedCardId);

  if (!card || !card.owned) {
    return collectionTemplate();
  }

  return `
    <div class="app-page">
      <header class="app-topbar">
        <button class="round-button" type="button" data-action="collection">‹</button>
        <h1 class="app-title" style="font-size: 18px">卡片详情</h1>
        <div class="app-progress">${card.rarity}</div>
      </header>
      <div class="detail-view">
        <img src="../app/${card.asset}" alt="">
        <h2>${card.name}</h2>
        <span class="detail-rarity" style="color: ${card.rarityColor}">
          ${card.rarityName}
        </span>
        <p>${escapeHtml(card.flavor)}</p>
        <span class="detail-count">持有 ${card.count} 张</span>
      </div>
    </div>
  `;
}

function navTemplate(active) {
  return `
    <nav class="app-nav">
      <button
        class="${active === "home" ? "active" : ""}"
        type="button"
        data-action="home"
      >
        抽卡
      </button>
      <button
        class="${active === "collection" ? "active" : ""}"
        type="button"
        data-action="collection"
      >
        图鉴
      </button>
    </nav>
  `;
}

function revealTemplate() {
  if (!reveal) {
    return "";
  }

  return `
    <div class="reveal-mask">
      <div class="reveal-panel">
        <span>${reveal.rarityName}</span>
        <img src="../app/${reveal.asset}" alt="">
        <h2>${reveal.name}</h2>
        <p>${escapeHtml(reveal.flavor)}</p>
        <strong>${reveal.isNew ? "NEW" : `已拥有 x${reveal.count}`}</strong>
        <button type="button" data-action="close-reveal">收下</button>
      </div>
    </div>
  `;
}

function render() {
  if (screen === "collection") {
    app.innerHTML = collectionTemplate();
  } else if (screen === "detail") {
    app.innerHTML = detailTemplate();
  } else {
    app.innerHTML = homeTemplate();
  }
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");

  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "home") {
    screen = "home";
    render();
  } else if (action === "collection") {
    screen = "collection";
    render();
  } else if (action === "detail") {
    selectedCardId = target.dataset.cardId;
    screen = "detail";
    render();
  } else if (action === "draw") {
    const result = drawCard(state, target.dataset.source);
    const detail = getCardDetail(result.state, result.card.id);

    state = result.state;
    reveal = {
      ...detail,
      isNew: result.isNew
    };
    persist();
    render();
  } else if (action === "close-reveal") {
    reveal = null;
    render();
  }
});

addStepsButton.addEventListener("click", () => {
  const current = getDailyStatus(state).exerciseValue;
  const result = recordExercise(
    state,
    getLocalDayKey(),
    current + 1000
  );

  state = result.state;
  persist();
  render();
});

resetButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  reveal = null;
  selectedCardId = null;
  screen = "home";
  render();
});

render();
