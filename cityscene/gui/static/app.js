// Browser map UI: draw an area -> save the job and generate in the background -> poll progress -> preview buildings -> install.
// UI text lives in i18n.js.
"use strict";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const STEPS = ["fetch", "clean", "classify", "build_dsf"];
// Height bands (metres), low to high
const HEIGHT_BANDS = [
  [0, "#9fb8c8", "< 10 m"],
  [10, "#7da7c9", "10–20 m"],
  [20, "#5b8fc4", "20–40 m"],
  [40, "#e0a13a", "40–60 m"],
  [60, "#d9622b", "60–150 m"],
  [150, "#a3242a", "≥ 150 m"],
];

let currentJob = null;
let currentDetail = null;
let logSince = 0;
let pollTimer = null;
let buildingsLayer = null;
let lastStatus = null;
let lastMessage = null;

// ---------- map ----------
const map = L.map("map", { zoomControl: true }).setView([-37.8136, 144.9631], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

const zoneLayer = new L.FeatureGroup().addTo(map);
let drawControl = null;

// leaflet-draw reads L.drawLocal when the toolbar is created, so the toolbar is rebuilt on language change
function addDrawControl() {
  if (drawControl) map.removeControl(drawControl);
  drawControl = new L.Control.Draw({
    position: "topleft",
    draw: {
      polyline: false, circle: false, marker: false, circlemarker: false,
      rectangle: { shapeOptions: { color: "#2f6fb0", weight: 2, fillOpacity: 0.08 } },
      polygon: { allowIntersection: false, shapeOptions: { color: "#2f6fb0", weight: 2, fillOpacity: 0.08 } },
    },
    edit: { featureGroup: zoneLayer },
  });
  map.addControl(drawControl);
}

map.on(L.Draw.Event.CREATED, (e) => { zoneLayer.addLayer(e.layer); updateArea(); });
map.on(L.Draw.Event.EDITED, updateArea);
map.on(L.Draw.Event.DELETED, updateArea);

const legend = L.control({ position: "bottomright" });
legend.onAdd = () => {
  const div = L.DomUtil.create("div", "legend");
  div.innerHTML = HEIGHT_BANDS.map(([, c, label]) => `<i style="background:${c}"></i>${label}`).join("<br>");
  return div;
};

function zoneArea() {
  let m2 = 0;
  zoneLayer.eachLayer((layer) => {
    const rings = layer.getLatLngs();
    m2 += L.GeometryUtil.geodesicArea(Array.isArray(rings[0]) ? rings[0] : rings);
  });
  return m2 / 1e6;
}

function updateArea() {
  const n = zoneLayer.getLayers().length;
  $("area").textContent = n ? t("zoneArea", { n, km2: zoneArea().toFixed(2) }) : t("noZone");
}

// ---------- language ----------
function refreshLanguage() {
  applyStaticText();
  addDrawControl();
  updateArea();
  if (lastStatus) renderStatus(lastStatus);
  if (currentDetail) render({ ...currentDetail, log: [] });
  if (lastMessage) say(lastMessage.key, lastMessage.vars, lastMessage.kind);
  refreshJobOptions();
}

document.querySelectorAll("#lang button").forEach((b) => {
  b.onclick = () => { setLang(b.dataset.lang); refreshLanguage(); };
});

// ---------- API ----------
async function api(path, options = {}) {
  const res = await fetch(path, {
    method: options.body ? "POST" : options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

// Messages are kept as key + variables so they re-translate on language change; with key null, vars.text is shown as is (server errors)
function say(key, vars = {}, kind = "") {
  lastMessage = { key, vars, kind };
  $("message").textContent = key ? t(key, vars) : vars.text;
  $("message").className = kind;
}

const sayError = (e) => say(null, { text: e.message }, "err");

// ---------- settings ----------
function renderStatus(s) {
  const ok = s.xplane_ok && s.dsftool_ok;
  $("settings-flag").innerHTML = ok ? '<span class="ok-flag">✓</span>' : `<span class="bad-flag">${t("needsSetup")}</span>`;
}

async function loadStatus() {
  const s = await api("/api/status");
  lastStatus = s;
  $("xplane-root").value = s.xplane_root;
  $("dsftool").value = s.dsftool;
  renderStatus(s);
  $("settings-box").open = !(s.xplane_ok && s.dsftool_ok);
  if (!$("default-height").value) $("default-height").value = s.defaults.default_height_m;
  if (!$("render-distance").value) $("render-distance").value = s.defaults.render_distance_km;
  return s;
}

$("save-settings").onclick = async () => {
  try {
    await api("/api/settings", { body: { xplane_root: $("xplane-root").value, dsftool: $("dsftool").value } });
    const s = await loadStatus();
    const ok = s.xplane_ok && s.dsftool_ok;
    say(ok ? "settingsSaved" : "settingsInvalid", {}, ok ? "ok" : "warn");
  } catch (e) { sayError(e); }
};

// ---------- search ----------
$("search").addEventListener("keydown", async (e) => {
  if (e.key !== "Enter" || !e.target.value.trim()) return;
  try {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(e.target.value);
    const lang = LANG === "zh" ? "zh-CN,en" : "en";
    const [hit] = await (await fetch(url, { headers: { "Accept-Language": lang } })).json();
    if (!hit) return say("notFound", {}, "warn");
    const [s, n, w, ea] = hit.boundingbox.map(Number);
    map.fitBounds([[s, w], [n, ea]], { maxZoom: 15 });
    say(null, { text: hit.display_name });
  } catch (err) { say("searchFailed", { err: err.message }, "err"); }
});

$("clear-zone").onclick = () => { zoneLayer.clearLayers(); updateArea(); };

$("job-name").addEventListener("input", (e) => {
  $("scenery-name").placeholder = "CityScene_" + (e.target.value || "name");
});

// ---------- jobs ----------
let jobList = [];

function refreshJobOptions() {
  const selected = $("jobs").value;
  $("jobs").innerHTML = '<option value="">—</option>' +
    jobList.map((j) => `<option value="${esc(j.name)}">${esc(j.name)}${j.built ? t("built") : ""}</option>`).join("");
  $("jobs").value = selected;
}

async function loadJobs(select) {
  jobList = await api("/api/jobs");
  refreshJobOptions();
  if (select) $("jobs").value = select;
}

$("jobs").onchange = (e) => { if (e.target.value) openJob(e.target.value, true); };

async function openJob(name, fit) {
  currentJob = name;
  logSince = 0;
  $("log").textContent = "";
  const d = await api(`/api/jobs/${name}`);
  $("job-name").value = d.meta.name;
  $("scenery-name").value = d.meta.scenery_name;
  const dh = d.meta.options?.heights?.default_height_m;
  if (dh) $("default-height").value = dh;
  const rd = d.meta.options?.dsf?.render_distance_km;
  if (rd) $("render-distance").value = rd;
  zoneLayer.clearLayers();
  L.geoJSON(d.zone).eachLayer((l) => zoneLayer.addLayer(l));
  updateArea();
  if (fit && zoneLayer.getLayers().length) map.fitBounds(zoneLayer.getBounds());
  render(d);
  if (d.run.state === "running") startPolling();
  else if (d.built) loadBuildings();
}

$("build").onclick = async () => {
  const name = $("job-name").value.trim();
  if (!name) return say("needName", {}, "warn");
  if (!zoneLayer.getLayers().length) return say("needZone", {}, "warn");
  const area = zoneArea();
  if (area > 25 && !confirm(t("confirmLarge", { km2: area.toFixed(1) }))) return;
  const existing = jobList.some((j) => j.name === name);
  if (existing && name !== currentJob && !confirm(t("confirmOverwrite", { name }))) return;
  try {
    const options = {};
    const dh = parseFloat($("default-height").value);
    if (dh > 0) options.heights = { default_height_m: dh };
    const rd = parseFloat($("render-distance").value);
    if (rd > 0) options.dsf = { render_distance_km: rd };
    await api("/api/jobs", { body: {
      name, scenery_name: $("scenery-name").value.trim(), zone: zoneLayer.toGeoJSON(), options, overwrite: existing,
    } });
    await loadJobs(name);
    currentJob = name;
    logSince = 0;
    $("log").textContent = "";
    await api(`/api/jobs/${name}/build`, { body: { force_fetch: $("force-fetch").checked } });
    say("started", {}, "ok");
    startPolling();
  } catch (e) { sayError(e); }
};

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(poll, 1000);
  poll();
}

async function poll() {
  if (!currentJob) return;
  try {
    const d = await api(`/api/jobs/${currentJob}?since=${logSince}`);
    render(d);
    if (d.run.state !== "running") {
      clearInterval(pollTimer);
      if (d.run.state === "done") { say("done", {}, "ok"); loadBuildings(); loadJobs(currentJob); }
      if (d.run.state === "error") say("failed", { err: d.run.error }, "err");
    }
  } catch (e) { sayError(e); clearInterval(pollTimer); }
}

function render(d) {
  currentDetail = d;
  const running = d.run.state === "running";
  $("progress-box").hidden = d.run.state === "idle" && !d.built;
  $("build").disabled = running;
  if (d.log.length) {
    $("log").textContent += d.log.join("\n") + "\n";
    $("log").scrollTop = $("log").scrollHeight;
    logSince = d.log_total;
  }
  const at = STEPS.indexOf(d.run.step);
  document.querySelectorAll("#steps li").forEach((li, i) => {
    li.className = "";
    if (d.run.state === "done" || (d.run.state === "idle" && d.built)) li.className = "done";
    else if (at >= 0 && i < at) li.className = "done";
    else if (i === at) li.className = d.run.state === "error" ? "failed" : "active";
  });
  $("result-box").hidden = !d.built || running;
  $("install").disabled = d.installed;
  $("uninstall").disabled = !d.installed;
  const c = d.reports.clean, k = d.reports.classify, b = d.reports.build;
  const rows = [];
  if (c) {
    rows.push([t("sumBuildings"), `${c.buildings} / ${c.kept_blocks}`]);
    rows.push([t("sumMax"), `${c.max_height_m} m`]);
    const hs = c.height_sources || {};
    const total = Object.values(hs).reduce((a, v) => a + v, 0) || 1;
    const real = (hs.osm_height || 0) + (hs.osm_part_height || 0) + (hs.osm_levels || 0);
    rows.push([t("sumOsmHeight"), t("sumOsmHeightVal", { pct: Math.round(100 * real / total) })]);
  }
  if (k) rows.push([t("sumCategories"), ["high_rise", "mid_rise", "low_rise"].map((x) => k.buildings_by_category[x] || 0).join(" / ")]);
  if (b) rows.push([t("sumTiles"), Object.keys(b.tiles).join(", ")]);
  rows.push([t("sumStatus"), d.installed ? t("installed") : t("notInstalled")]);
  $("summary").innerHTML = rows.map(([k2, v]) => `<dt>${esc(k2)}</dt><dd>${esc(v)}</dd>`).join("");
}

function heightColor(h) {
  let color = HEIGHT_BANDS[0][1];
  for (const [min, c] of HEIGHT_BANDS) if (h >= min) color = c;
  return color;
}

async function loadBuildings() {
  if (buildingsLayer) { map.removeLayer(buildingsLayer); buildingsLayer = null; }
  if (!$("show-buildings").checked || !currentJob) { map.removeControl(legend); return; }
  const data = await api(`/api/jobs/${currentJob}/buildings`);
  buildingsLayer = L.geoJSON(data, {
    style: (f) => ({ color: heightColor(f.properties.height_m), weight: 0.6, fillOpacity: 0.65 }),
    onEachFeature: (f, layer) => {
      const p = f.properties;
      layer.bindTooltip(`${p.name ? esc(p.name) + "<br>" : ""}${p.height_m} m (${esc(p.height_source)})<br>${esc(p.facade_style)}`);
    },
  }).addTo(map);
  legend.addTo(map);
  if (data.total > data.features.length) say("previewLimited", { shown: data.features.length, total: data.total }, "warn");
}

$("show-buildings").onchange = loadBuildings;

$("install").onclick = async () => {
  try {
    const r = await api(`/api/jobs/${currentJob}/install`, { body: {} });
    const backup = r.backup ? t("backupNote", { name: r.backup }) : "";
    say("installedMsg", { link: r.link, ini: r.ini, backup }, "ok");
    openJob(currentJob, false);
  } catch (e) { sayError(e); }
};

$("uninstall").onclick = async () => {
  if (!confirm(t("confirmUninstall"))) return;
  try {
    await api(`/api/jobs/${currentJob}/uninstall`, { body: {} });
    say("uninstalledMsg", {}, "ok");
    openJob(currentJob, false);
  } catch (e) { sayError(e); }
};

applyStaticText();
addDrawControl();
updateArea();
loadStatus().catch(sayError);
loadJobs().catch(sayError);
