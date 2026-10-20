// UI text (English / Chinese), English by default; the choice is remembered in localStorage.
// Static text is marked with data-i18n / data-i18n-placeholder, dynamic text uses t(key, {vars}).
"use strict";

const MESSAGES = {
  en: {
    title: "XP12 City Scenery",
    subtitle: "OSM buildings → X-Plane 12 default facades → DSF, hiding default buildings inside the area",
    settings: "Local settings",
    needsSetup: "needs setup",
    xplaneDir: "X-Plane 12 folder",
    save: "Save",
    dsftoolHint: "DSFTool ships with Laminar's XPTools (developer.x-plane.com/tools/xptools).",
    s1: "1 · Area",
    searchPh: "Search a city or place, press Enter",
    drawHint: "Draw rectangles or polygons with the ▭ / ⬠ tools at the top left of the map; several are allowed. Keep the first try small (1–5 km²).",
    noZone: "No area drawn yet",
    zoneArea: "{n} shape(s), {km2} km² in total",
    clearZone: "Clear area",
    s2: "2 · Job",
    jobName: "Job name (letters, digits, _ -)",
    sceneryName: "Scenery pack name",
    defaultHeight: "Default height when OSM has none (m)",
    forceFetch: "Re-download OSM (ignore cache)",
    build: "Save area and generate",
    existingJobs: "Existing jobs",
    built: " (built)",
    s3: "3 · Progress",
    stepFetch: "Download OSM",
    stepClean: "Clean & heights",
    stepClassify: "Classify & facades",
    stepDsf: "Compile DSF",
    s4: "4 · Result",
    showBuildings: "Show buildings on map (coloured by height)",
    install: "Install to X-Plane",
    uninstall: "Uninstall",
    installHint: "Installs as a folder link, nothing is copied; scenery_packs.ini is backed up before any change. Quit X-Plane first.",
    footer: "Building data © OpenStreetMap contributors (ODbL)",
    settingsSaved: "Settings saved",
    settingsInvalid: "Saved, but a path is still invalid — please check",
    notFound: "Place not found",
    searchFailed: "Search failed: {err}",
    needName: "Please enter a job name",
    needZone: "Draw an area on the map first",
    confirmLarge: "The area is {km2} km²; downloading and generating may take a long time. Continue?",
    confirmOverwrite: "Job {name} already exists. Replace its area?",
    started: "Generation started",
    done: "Generation finished",
    failed: "Generation failed: {err}",
    sumBuildings: "Buildings / blocks",
    sumMax: "Tallest",
    sumOsmHeight: "With OSM height",
    sumOsmHeightVal: "{pct}% (rest use the default)",
    sumCategories: "High / mid / low rise",
    sumTiles: "DSF tiles",
    sumStatus: "Status",
    installed: "Installed",
    notInstalled: "Not installed",
    previewLimited: "Preview shows only the first {shown} of {total} blocks",
    installedMsg: "Installed ({link}; scenery_packs.ini: {ini}{backup})",
    backupNote: ", backup {name}",
    confirmUninstall: "Remove this pack's link from Custom Scenery and its line from scenery_packs.ini? (Generated files are kept.)",
    uninstalledMsg: "Uninstalled",
  },
  zh: {
    title: "XP12 城市地景生成",
    subtitle: "OSM 建筑 → XP12 自带 facade → DSF，自动屏蔽选区内默认建筑",
    settings: "本机设置",
    needsSetup: "需要填写",
    xplaneDir: "X-Plane 12 目录",
    save: "保存",
    dsftoolHint: "DSFTool 在 Laminar 的 XPTools 里（developer.x-plane.com/tools/xptools）。",
    s1: "1 · 选区",
    searchPh: "搜索城市或地点，回车",
    drawHint: "用地图左上角的 ▭ / ⬠ 工具画矩形或多边形，可画多块。第一版宜小（1–5 km²）。",
    noZone: "尚未画选区",
    zoneArea: "{n} 块，共 {km2} km²",
    clearZone: "清除选区",
    s2: "2 · 任务",
    jobName: "任务名（英文）",
    sceneryName: "地景包名",
    defaultHeight: "无高度数据时默认高度（米）",
    forceFetch: "重新下载 OSM（忽略缓存）",
    build: "保存选区并生成",
    existingJobs: "已有任务",
    built: "（已生成）",
    s3: "3 · 进度",
    stepFetch: "下载 OSM",
    stepClean: "清洗与高度",
    stepClassify: "分类与 facade",
    stepDsf: "编译 DSF",
    s4: "4 · 结果",
    showBuildings: "地图上显示建筑（按高度着色）",
    install: "安装到 X-Plane",
    uninstall: "卸载",
    installHint: "安装用目录链接，不复制文件；改 scenery_packs.ini 前会自动备份。安装前请先退出 X-Plane。",
    footer: "建筑数据 © OpenStreetMap contributors (ODbL)",
    settingsSaved: "设置已保存",
    settingsInvalid: "已保存，但路径仍无效，请检查",
    notFound: "没有找到该地点",
    searchFailed: "搜索失败：{err}",
    needName: "请填写任务名",
    needZone: "请先在地图上画选区",
    confirmLarge: "选区 {km2} km²，下载和生成可能要很久。继续？",
    confirmOverwrite: "任务 {name} 已存在，覆盖它的选区？",
    started: "已开始生成",
    done: "生成完成",
    failed: "生成失败：{err}",
    sumBuildings: "建筑 / 体块",
    sumMax: "最高",
    sumOsmHeight: "有 OSM 高度",
    sumOsmHeightVal: "{pct}%（其余用默认值）",
    sumCategories: "高 / 中 / 低层",
    sumTiles: "DSF 瓦片",
    sumStatus: "状态",
    installed: "已安装",
    notInstalled: "未安装",
    previewLimited: "预览只显示前 {shown} / {total} 个体块",
    installedMsg: "已安装（{link}；scenery_packs.ini：{ini}{backup}）",
    backupNote: "，备份 {name}",
    confirmUninstall: "从 Custom Scenery 删除本包的链接并从 scenery_packs.ini 删除条目？（生成的文件保留）",
    uninstalledMsg: "已卸载",
  },
};

// Chinese text for the leaflet-draw toolbar (English uses the library's own)
const DRAW_ZH = {
  draw: {
    toolbar: {
      actions: { title: "取消绘制", text: "取消" },
      finish: { title: "完成绘制", text: "完成" },
      undo: { title: "删除最后一个点", text: "删除最后一点" },
      buttons: { polygon: "画多边形", rectangle: "画矩形" },
    },
    handlers: {
      polygon: { tooltip: { start: "点击开始画多边形", cont: "点击继续", end: "点击第一个点闭合" } },
      rectangle: { tooltip: { start: "按住拖动画矩形" } },
      simpleshape: { tooltip: { end: "松开鼠标完成" } },
    },
  },
  edit: {
    toolbar: {
      actions: {
        save: { title: "保存修改", text: "保存" },
        cancel: { title: "放弃修改", text: "取消" },
        clearAll: { title: "删除全部", text: "全部删除" },
      },
      buttons: { edit: "编辑选区", editDisabled: "没有可编辑的选区", remove: "删除选区", removeDisabled: "没有可删除的选区" },
    },
    handlers: {
      edit: { tooltip: { text: "拖动顶点修改选区", subtext: "点取消放弃修改" } },
      remove: { tooltip: { text: "点击要删除的选区" } },
    },
  },
};

function storedLang() {
  try {
    const v = localStorage.getItem("cityscene.lang");
    return v === "zh" || v === "en" ? v : "en";
  } catch (e) {
    return "en";
  }
}

let LANG = storedLang();

function t(key, vars = {}) {
  const text = (MESSAGES[LANG] && MESSAGES[LANG][key]) ?? MESSAGES.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object") deepMerge(target[k] ?? (target[k] = {}), v);
    else target[k] = v;
  }
}

const DRAW_EN = typeof L !== "undefined" && L.drawLocal ? JSON.parse(JSON.stringify(L.drawLocal)) : null;

function applyStaticText() {
  document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("#lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
  if (DRAW_EN) {
    const local = JSON.parse(JSON.stringify(DRAW_EN));
    if (LANG === "zh") deepMerge(local, DRAW_ZH);
    deepMerge(L.drawLocal, local);
  }
}

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem("cityscene.lang", lang); } catch (e) { /* private mode etc.: just don't remember */ }
  applyStaticText();
}
