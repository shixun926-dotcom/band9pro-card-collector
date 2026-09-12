export const RARITY_DEFS = Object.freeze([
  Object.freeze({
    id: "N",
    name: "普通",
    weight: 6000,
    color: "#8c9aad",
    softColor: "#1d2a3a"
  }),
  Object.freeze({
    id: "R",
    name: "稀有",
    weight: 3000,
    color: "#4aa8ff",
    softColor: "#122b48"
  }),
  Object.freeze({
    id: "SR",
    name: "史诗",
    weight: 900,
    color: "#b876ff",
    softColor: "#2a173f"
  }),
  Object.freeze({
    id: "SSR",
    name: "传说",
    weight: 100,
    color: "#ffbf45",
    softColor: "#3d290c"
  })
]);

export const CARDS = Object.freeze([
  Object.freeze({ id: "n01", name: "晨曦", rarity: "N", asset: "assets/cards/n01.png", flavor: "第一束光越过山脊。" }),
  Object.freeze({ id: "n02", name: "微风", rarity: "N", asset: "assets/cards/n02.png", flavor: "带来远处的草木气息。" }),
  Object.freeze({ id: "n03", name: "溪流", rarity: "N", asset: "assets/cards/n03.png", flavor: "不停向前，也不会迷路。" }),
  Object.freeze({ id: "n04", name: "萤火", rarity: "N", asset: "assets/cards/n04.png", flavor: "微小的光也能照亮一段路。" }),
  Object.freeze({ id: "n05", name: "山丘", rarity: "N", asset: "assets/cards/n05.png", flavor: "沉默地托住每一次登高。" }),
  Object.freeze({ id: "n06", name: "白露", rarity: "N", asset: "assets/cards/n06.png", flavor: "清晨最安静的一颗水珠。" }),
  Object.freeze({ id: "n07", name: "松影", rarity: "N", asset: "assets/cards/n07.png", flavor: "风经过时，影子也会呼吸。" }),
  Object.freeze({ id: "n08", name: "潮声", rarity: "N", asset: "assets/cards/n08.png", flavor: "把远方一遍遍送到耳边。" }),
  Object.freeze({ id: "n09", name: "云帆", rarity: "N", asset: "assets/cards/n09.png", flavor: "向天空借一阵顺风。" }),
  Object.freeze({ id: "n10", name: "麦浪", rarity: "N", asset: "assets/cards/n10.png", flavor: "金色在风里翻涌。" }),
  Object.freeze({ id: "n11", name: "初雪", rarity: "N", asset: "assets/cards/n11.png", flavor: "世界忽然变得很轻。" }),
  Object.freeze({ id: "n12", name: "星尘", rarity: "N", asset: "assets/cards/n12.png", flavor: "所有奇迹最初都很微小。" }),

  Object.freeze({ id: "r01", name: "月桂", rarity: "R", asset: "assets/cards/r01.png", flavor: "月色为勇者留下清香。" }),
  Object.freeze({ id: "r02", name: "极光", rarity: "R", asset: "assets/cards/r02.png", flavor: "夜幕之上流动的火焰。" }),
  Object.freeze({ id: "r03", name: "深海", rarity: "R", asset: "assets/cards/r03.png", flavor: "藏着尚未命名的世界。" }),
  Object.freeze({ id: "r04", name: "雷羽", rarity: "R", asset: "assets/cards/r04.png", flavor: "一瞬划破长空。" }),
  Object.freeze({ id: "r05", name: "花火", rarity: "R", asset: "assets/cards/r05.png", flavor: "短暂，却被所有人记住。" }),
  Object.freeze({ id: "r06", name: "赤霄", rarity: "R", asset: "assets/cards/r06.png", flavor: "云层尽头燃烧的边界。" }),
  Object.freeze({ id: "r07", name: "银霜", rarity: "R", asset: "assets/cards/r07.png", flavor: "把寂静雕成锋利的纹路。" }),

  Object.freeze({ id: "sr01", name: "日冕", rarity: "SR", asset: "assets/cards/sr01.png", flavor: "恒星的冠冕在黑空中升起。" }),
  Object.freeze({ id: "sr02", name: "星鲸", rarity: "SR", asset: "assets/cards/sr02.png", flavor: "游过群星之间没有尽头的海。" }),
  Object.freeze({ id: "sr03", name: "时之门", rarity: "SR", asset: "assets/cards/sr03.png", flavor: "每一次开启都指向不同的答案。" }),
  Object.freeze({ id: "sr04", name: "天穹", rarity: "SR", asset: "assets/cards/sr04.png", flavor: "万物都在它的注视之下。" }),

  Object.freeze({ id: "ssr01", name: "万物之心", rarity: "SSR", asset: "assets/cards/ssr01.png", flavor: "所有光最终回到同一个起点。" })
]);

function indexBy(items, key) {
  const index = {};

  for (const item of items) {
    index[item[key]] = item;
  }

  return index;
}

export const CARD_BY_ID = Object.freeze(indexBy(CARDS, "id"));
export const RARITY_BY_ID = Object.freeze(
  indexBy(RARITY_DEFS, "id")
);
