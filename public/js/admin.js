// ── Emoji picker ─────────────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { label: "Caras", emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😍","🥰","😘","😎","🤓","🧐","😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","😈","👿","😱","😰","😨","🤯","😳","🥵","🥶","😴","🤤","🤢","🤮","🤧","😷","🤒","🤕","🥳","🤩","🥸","😻","😼","🤑"] },
  { label: "Manos", emojis: ["👍","👎","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐","✋","🖖","👏","🙌","🤲","🤝","🙏","✍️","💪","🦾","🫶","🫵","🫱","🫲"] },
  { label: "Personas", emojis: ["🙋","🙋‍♂️","🙋‍♀️","🤷","🤷‍♂️","🤷‍♀️","🤦","💁","🧑‍💼","👨‍💼","👩‍💼","🧑‍🏫","👨‍🏫","🤵","👔","🎓","🏆","🥇","🥈","🥉","🎖️","🏅","🎯","🎪","👥","👤"] },
  { label: "Objetos", emojis: ["🔥","💡","🛠️","🔑","🗝️","🔒","🔓","📋","📌","📎","✏️","📝","📊","📈","📉","💼","📦","📬","📱","💻","🖥️","🖨️","⌨️","🖱️","📡","🔭","🔬","💊","💉","🧪","🧲","⚙️","🔧","🔩","🪛","🪚","🗜️","⛓️","🪝","🧰","🗄️","🗃️","📁","📂","🗂️","📅","📆","🗒️"] },
  { label: "Símbolos", emojis: ["✅","❌","⚠️","❓","❗","💬","💭","🗯️","💥","✨","🌟","⭐","🌈","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","🔲","🔳","▪️","▫️","🏁","🚩","🎌","🏴","🏳️","🆕","🆒","🆓","🔝","🆙","🆗","🆘","🆚","🉐","🚀","⚡","🌀","🌊"] },
  { label: "Naturaleza", emojis: ["🌱","🌿","🍀","🌲","🌳","🌵","🌾","🌺","🌸","🌼","🌻","🍁","🍂","🍃","🌍","🌎","🌏","🌙","☀️","🌤️","⛅","🌧️","⛈️","🌩️","❄️","🌊","💧","🌈","☔","⭐","🌟","💫","✨","🌠","☁️"] },
  { label: "Comida", emojis: ["☕","🍵","🧃","🥤","🍺","🥂","🍾","🎂","🍰","🧁","🍩","🍪","🍫","🍬","🍭","🍑","🍓","🍎","🍊","🍋","🍇","🍉","🍌","🥝","🍕","🍔","🌮","🌯","🥗","🍜","🍣","🍱"] },
];

let pickerTarget = null;
let pickerEl = null;

function buildPicker() {
  if (pickerEl) return;
  pickerEl = document.createElement("div");
  pickerEl.className = "emoji-picker hidden";
  pickerEl.innerHTML = `
    <div class="ep-tabs">${EMOJI_GROUPS.map((g, i) =>
      `<button class="ep-tab${i === 0 ? " active" : ""}" data-gi="${i}">${g.emojis[0]}</button>`
    ).join("")}</div>
    <div class="ep-grid" id="ep-grid"></div>
  `;
  document.body.appendChild(pickerEl);

  pickerEl.querySelector(".ep-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".ep-tab");
    if (!btn) return;
    pickerEl.querySelectorAll(".ep-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderPickerGroup(Number(btn.dataset.gi));
  });

  document.getElementById("ep-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".ep-emoji-btn");
    if (!btn || !pickerTarget) return;
    pickerTarget.value = btn.textContent;
    pickerTarget.dispatchEvent(new Event("input", { bubbles: true }));
    closePicker();
  });

  renderPickerGroup(0);
}

function renderPickerGroup(gi) {
  const grid = document.getElementById("ep-grid");
  grid.innerHTML = EMOJI_GROUPS[gi].emojis
    .map((e) => `<button class="ep-emoji-btn" type="button">${e}</button>`)
    .join("");
}

function openPicker(inputEl) {
  buildPicker();
  pickerTarget = inputEl;
  const rect = inputEl.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  pickerEl.classList.remove("hidden");
  if (spaceBelow < 280) {
    pickerEl.style.top  = (window.scrollY + rect.top - 260) + "px";
  } else {
    pickerEl.style.top  = (window.scrollY + rect.bottom + 4) + "px";
  }
  pickerEl.style.left = Math.min(rect.left, window.innerWidth - 300) + "px";
}

function closePicker() {
  if (pickerEl) pickerEl.classList.add("hidden");
  pickerTarget = null;
}

document.addEventListener("click", (e) => {
  if (pickerEl && !pickerEl.classList.contains("hidden")) {
    if (!pickerEl.contains(e.target) && !e.target.classList.contains("emoji") && !e.target.classList.contains("pe-emoji")) {
      closePicker();
    }
  }
});

// Abrir picker al hacer clic en cualquier input emoji
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji") || e.target.classList.contains("pe-emoji")) {
    e.stopPropagation();
    if (pickerTarget === e.target && pickerEl && !pickerEl.classList.contains("hidden")) {
      closePicker();
    } else {
      openPicker(e.target);
    }
  }
});

const socket = io();

// ── DOM refs ──────────────────────────────────────────────────────────────
const authCard      = document.getElementById("auth-card");
const adminApp      = document.getElementById("admin-app");
const authForm      = document.getElementById("auth-form");
const authError     = document.getElementById("auth-error");
const questionForm  = document.getElementById("question-form");
const questionInput = document.getElementById("question");
const presetSelect  = document.getElementById("preset");
const presetHint    = document.getElementById("preset-hint");
const emoEditor     = document.getElementById("emo-editor");
const addEmoBtn     = document.getElementById("add-emo");
const adminError    = document.getElementById("admin-error");
const mazosError    = document.getElementById("mazos-error");
const peopleCount   = document.getElementById("people-count");
const adminCountEl  = document.getElementById("admin-count");
const connCountEl   = document.getElementById("conn-count");
const peopleList    = document.getElementById("people-list");
const liveDot       = document.getElementById("live-dot");
const statusLabel   = document.getElementById("status-label");
const questionText  = document.getElementById("question-text");
const voteCount     = document.getElementById("vote-count");
const openLabel     = document.getElementById("open-label");
const bars          = document.getElementById("bars");
const toggleBtn     = document.getElementById("toggle-btn");
const resetBtn      = document.getElementById("reset-btn");
const clearBtn      = document.getElementById("clear-btn");
const toast         = document.getElementById("toast");
const presetsEditor   = document.getElementById("presets-editor");
const newPresetBtn    = document.getElementById("new-preset-btn");
const historyList     = document.getElementById("history-list");
const historyCount    = document.getElementById("history-count");
const exportPdfBtn    = document.getElementById("export-pdf-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// ── State ─────────────────────────────────────────────────────────────────
let authed = false;
let lastState = null;
let presets = [];
let draft = [];
let presetId = "referidos";
let suppressPresetChange = false;

// ── Tabs ──────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(v) {
  return String(v)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function percent(count, total) {
  return total ? Math.round((count / total) * 100) : 0;
}

function totalVotes(state) { return state.voteCount || 0; }

// ── Pregunta: preset select ───────────────────────────────────────────────
function renderPresetSelect() {
  const prev = presetId;
  presetSelect.innerHTML = "";
  if (!presets.length) {
    const opt = document.createElement("option");
    opt.value = "custom";
    opt.textContent = "✏️ Personalizado (aún no tienes sets guardados)";
    presetSelect.appendChild(opt);
    presetHint.textContent = 'No tienes sets guardados. Ve a la pestaña "Sets de emojis" para crear el primero, o edita los emojis aqui directamente.';
    presetId = "custom";
    if (!draft.length) draft = [
      { emoji: "⭐", label: "", meaning: "" },
      { emoji: "💫", label: "", meaning: "" },
    ];
    renderDraftEditor();
    return;
  }
  presets.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "✏️ Personalizado (solo esta pregunta)";
  presetSelect.appendChild(custom);
  presetSelect.value = prev && (presets.some((p) => p.id === prev) || prev === "custom") ? prev : (presets[0] && presets[0].id);
}

function clonePreset(id) {
  const preset = presets.find((p) => p.id === id) || presets[0];
  return (preset.emoticons || []).map((e) => ({ emoji: e.emoji, label: e.label, meaning: e.meaning }));
}

function markCustomIfEdited() {
  if (presetId === "custom") return;
  const original = presets.find((p) => p.id === presetId);
  if (!original) { presetId = "custom"; return; }
  const same = original.emoticons.length === draft.length &&
    original.emoticons.every((e, i) => e.emoji === draft[i].emoji && e.label === draft[i].label && e.meaning === draft[i].meaning);
  if (!same) {
    presetId = "custom";
    suppressPresetChange = true;
    presetSelect.value = "custom";
    presetHint.textContent = "Set personalizado para esta pregunta.";
    suppressPresetChange = false;
  }
}

function renderDraftEditor() {
  emoEditor.innerHTML = "";
  draft.forEach((row, i) => {
    const wrap = document.createElement("div");
    wrap.className = "emo-edit";
    wrap.innerHTML = `
      <div class="emo-edit-top">
        <input class="emoji" data-field="emoji" data-index="${i}" maxlength="8" value="${escapeHtml(row.emoji)}" aria-label="Emoticón" />
        <input data-field="label" data-index="${i}" maxlength="24" value="${escapeHtml(row.label)}" placeholder="Nombre" aria-label="Nombre" />
        <button class="btn btn-ghost btn-tiny" type="button" data-remove="${i}" ${draft.length <= 2 ? "disabled" : ""}>Quitar</button>
      </div>
      <textarea data-field="meaning" data-index="${i}" maxlength="180" placeholder="Qué significa votar esto" aria-label="Significado">${escapeHtml(row.meaning)}</textarea>
    `;
    emoEditor.appendChild(wrap);
  });
  addEmoBtn.disabled = draft.length >= 6;
}

function applyPreset(id) {
  if (id === "custom") {
    presetId = "custom";
    presetHint.textContent = "Set personalizado: edita emoji, nombre y significado para esta pregunta.";
    if (!draft.length) draft = clonePreset("referidos");
    renderDraftEditor(); return;
  }
  presetId = id;
  const p = presets.find((x) => x.id === id);
  presetHint.textContent = p ? p.hint : "Puedes editar cada emoji para que coincida con la pregunta.";
  draft = clonePreset(id);
  renderDraftEditor();
}

function collectDraft() {
  return draft.map((r) => ({ emoji: r.emoji.trim(), label: r.label.trim(), meaning: r.meaning.trim() }));
}

presetSelect.addEventListener("change", () => {
  if (suppressPresetChange) return;
  applyPreset(presetSelect.value);
});

emoEditor.addEventListener("input", (e) => {
  const field = e.target.getAttribute("data-field");
  const idx   = Number(e.target.getAttribute("data-index"));
  if (!field || isNaN(idx) || !draft[idx]) return;
  draft[idx][field] = e.target.value;
  markCustomIfEdited();
});

emoEditor.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn || btn.disabled) return;
  draft.splice(Number(btn.getAttribute("data-remove")), 1);
  presetId = "custom"; presetSelect.value = "custom";
  presetHint.textContent = "Set personalizado para esta pregunta.";
  renderDraftEditor();
});

addEmoBtn.addEventListener("click", () => {
  if (draft.length >= 6) return;
  draft.push({ emoji: "⭐", label: "", meaning: "" });
  presetId = "custom"; presetSelect.value = "custom";
  presetHint.textContent = "Set personalizado para esta pregunta.";
  renderDraftEditor();
});

// ── Pregunta: render resultados ───────────────────────────────────────────
function render(state) {
  const inSala = state.participantCount === 1 ? "1 en sala" : `${state.participantCount} en sala`;
  peopleCount.textContent = inSala;
  if (adminCountEl) {
    adminCountEl.textContent = state.adminCount ?? 1;
    const adminPill = document.getElementById("admin-pill");
    if (adminPill) adminPill.title = `${state.adminCount ?? 1} admin(s) conectado(s) ahora mismo`;
  }
  if (connCountEl) connCountEl.textContent = state.totalConnections ?? 0;
  liveDot.classList.toggle("off", !state.question.active);

  const hasQ = Boolean(state.question.text);
  statusLabel.textContent = !hasQ ? "Sin texto publicado" : state.question.active ? "Votación abierta" : "Votación cerrada";
  questionText.textContent = hasQ ? state.question.text : "Todavía no hay un texto publicado.";
  voteCount.textContent = `${state.voteCount} votos`;
  openLabel.textContent  = state.question.active ? "Abierta" : "Cerrada";
  toggleBtn.textContent  = state.question.active ? "Cerrar votación" : "Reabrir votación";
  toggleBtn.disabled = !hasQ;

  peopleList.innerHTML = "";
  if (!state.participants.length) {
    peopleList.innerHTML = '<span class="chip">Nadie conectado aún</span>';
  } else {
    state.participants.forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "participant-chip";
      chip.innerHTML = `
        <strong>${escapeHtml(p.name)}</strong>
        ${p.empresa ? `<span class="chip-empresa">${escapeHtml(p.empresa)}</span>` : ""}
        ${p.giro    ? `<em class="chip-giro">${escapeHtml(p.giro)}</em>` : ""}
      `;
      peopleList.appendChild(chip);
    });
  }

  bars.innerHTML = "";
  state.emoticons.forEach((emo, i) => {
    const count = state.counts[emo.id] || 0;
    const names = (state.voters[emo.id] || []).map((v) =>
      v.empresa ? `${escapeHtml(v.name)} <em style="font-weight:400">(${escapeHtml(v.empresa)})</em>` : escapeHtml(v.name)
    ).join(" · ");
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-meta">
        <strong>${emo.emoji} ${escapeHtml(emo.label)}</strong>
        <span>${count} · ${percent(count, totalVotes(state))}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill tone-${i}" style="width:${percent(count, totalVotes(state))}%"></div></div>
      <p class="lede" style="max-width:none;font-size:12px;margin-top:2px">${escapeHtml(emo.meaning)}</p>
      <div class="names">${names || "Sin votos todavía"}</div>
    `;
    bars.appendChild(row);
  });
  // Historial
  if (Array.isArray(state.history)) renderHistory(state.history);
}

// ── Tab Mazos: editor de presets ──────────────────────────────────────────
function renderPresetsEditor() {
  presetsEditor.innerHTML = "";
  if (!presets.length) {
    presetsEditor.innerHTML = `<div class="info-box" style="text-align:center;padding:24px">
      <strong>Aún no tienes sets guardados.</strong><br>
      Pulsa <strong>+ Nuevo set</strong> para crear el primero.
    </div>`;
    return;
  }
  presets.forEach((preset) => {
    const card = document.createElement("div");
    card.className = "card preset-card";
    card.dataset.id = preset.id;

    const eRows = preset.emoticons.map((e, i) => `
      <div class="emo-edit">
        <div class="emo-edit-top">
          <input class="emoji pe-emoji" data-pi="${preset.id}" data-ei="${i}" data-field="emoji" maxlength="8" value="${escapeHtml(e.emoji)}" />
          <input class="pe-label" data-pi="${preset.id}" data-ei="${i}" data-field="label" maxlength="24" value="${escapeHtml(e.label)}" placeholder="Nombre" />
          <button class="btn btn-ghost btn-tiny pe-remove-emo" type="button" data-pi="${preset.id}" data-ei="${i}" ${preset.emoticons.length <= 2 ? "disabled" : ""}>✕</button>
        </div>
        <textarea class="pe-meaning" data-pi="${preset.id}" data-ei="${i}" data-field="meaning" maxlength="180" placeholder="Significado">${escapeHtml(e.meaning)}</textarea>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="preset-header">
        <div style="flex:1">
          <div class="field" style="margin-top:0">
            <label>Nombre del set</label>
            <input class="pe-name" data-pi="${preset.id}" maxlength="48" value="${escapeHtml(preset.name)}" placeholder="Ej. Referidos, Votación semanal..." />
          </div>
          <div class="field">
            <label>Descripción (opcional)</label>
            <input class="pe-hint" data-pi="${preset.id}" maxlength="120" value="${escapeHtml(preset.hint)}" placeholder="Cuándo usar este set" />
          </div>
        </div>
      </div>
      <div class="preset-emos" data-pi="${preset.id}">${eRows}</div>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn btn-ghost btn-tiny pe-add-emo" type="button" data-pi="${preset.id}">+ Emoticón</button>
        <button class="btn btn-fire pe-save" type="button" data-pi="${preset.id}" style="width:auto;margin:0">Guardar set</button>
        <button class="btn btn-ghost btn-tiny pe-delete" type="button" data-pi="${preset.id}" style="color:var(--danger)">Eliminar</button>
      </div>
    `;
    presetsEditor.appendChild(card);
  });
}

// Delegación de eventos en el editor de presets
presetsEditor.addEventListener("input", (e) => {
  const pi = e.target.dataset.pi;
  if (!pi) return;
  const preset = presets.find((p) => p.id === pi);
  if (!preset) return;
  if (e.target.classList.contains("pe-name")) {
    preset.name = e.target.value;
    // Actualizar la opción en el selector de la pestaña Pregunta en tiempo real
    const opt = presetSelect.querySelector(`option[value="${pi}"]`);
    if (opt) opt.textContent = e.target.value || "(sin nombre)";
  }
  else if (e.target.classList.contains("pe-hint")) preset.hint = e.target.value;
  else if (e.target.classList.contains("pe-emoji")) {
    const ei = Number(e.target.dataset.ei);
    if (preset.emoticons[ei]) preset.emoticons[ei].emoji = e.target.value;
  } else if (e.target.classList.contains("pe-label")) {
    const ei = Number(e.target.dataset.ei);
    if (preset.emoticons[ei]) preset.emoticons[ei].label = e.target.value;
  } else if (e.target.classList.contains("pe-meaning")) {
    const ei = Number(e.target.dataset.ei);
    if (preset.emoticons[ei]) preset.emoticons[ei].meaning = e.target.value;
  }
});

presetsEditor.addEventListener("click", (e) => {
  // Guardar
  const saveBtn = e.target.closest(".pe-save");
  if (saveBtn) {
    const pi = saveBtn.dataset.pi;
    const preset = presets.find((p) => p.id === pi);
    if (!preset) return;
    mazosError.textContent = "";
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
    socket.emit("admin:save-preset", { id: pi, data: preset });
    return;
  }
  // Eliminar set
  const delBtn = e.target.closest(".pe-delete");
  if (delBtn) {
    if (!confirm("¿Eliminar este set de emojis?")) return;
    socket.emit("admin:delete-preset", { id: delBtn.dataset.pi });
    return;
  }
  // Añadir emoticón al mazo
  const addEmoP = e.target.closest(".pe-add-emo");
  if (addEmoP) {
    const pi = addEmoP.dataset.pi;
    const preset = presets.find((p) => p.id === pi);
    if (!preset || preset.emoticons.length >= 6) return;
    preset.emoticons.push({ id: `opt-${preset.emoticons.length}`, emoji: "⭐", label: "", meaning: "" });
    renderPresetsEditor(); return;
  }
  // Quitar emoticón del mazo
  const removeEmo = e.target.closest(".pe-remove-emo");
  if (removeEmo) {
    const pi = removeEmo.dataset.pi;
    const ei = Number(removeEmo.dataset.ei);
    const preset = presets.find((p) => p.id === pi);
    if (!preset || preset.emoticons.length <= 2) return;
    preset.emoticons.splice(ei, 1);
    renderPresetsEditor();
  }
});

newPresetBtn.addEventListener("click", () => socket.emit("admin:new-preset"));

// ── Pregunta: eventos ─────────────────────────────────────────────────────
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  authError.textContent = "";
  socket.emit("admin:auth", { pin: document.getElementById("pin").value });
});

questionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  adminError.textContent = "";
  socket.emit("admin:set-question", { text: questionInput.value, emoticons: collectDraft(), presetId });
});

toggleBtn.addEventListener("click", () => socket.emit("admin:toggle"));
resetBtn.addEventListener("click",  () => socket.emit("admin:reset-votes"));
clearBtn.addEventListener("click",  () => { questionInput.value = ""; socket.emit("admin:clear-question"); });

// ── Socket events ─────────────────────────────────────────────────────────
socket.on("admin:question-archived", ({ num }) => {
  // Limpiar el formulario y dejar listo para la siguiente pregunta
  questionInput.value = "";
  draft = [];
  if (presets.length) applyPreset(presets[0].id);
  // Cambiar pestaña a "Pregunta" para que el admin escriba la siguiente
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  document.querySelector('[data-tab="preguntas"]').classList.add("active");
  document.getElementById("tab-preguntas").classList.remove("hidden");
  showToast(`✅ Pregunta #${num} guardada en historial — escribe la siguiente`);
});
function initPresets(nextPresets) {
  if (!Array.isArray(nextPresets)) return;
  presets = nextPresets;
  renderPresetSelect();
  if (presets.length) applyPreset(presets[0].id);
  renderPresetsEditor();
}

socket.on("admin:auth-result", ({ ok, presets: p }) => {
  if (!ok) { authError.textContent = "PIN incorrecto."; return; }
  authed = true;
  initPresets(p);
  authCard.classList.add("hidden");
  adminApp.classList.remove("hidden");
  const logoutBtn = document.getElementById("logout-admin-btn");
  if (logoutBtn) logoutBtn.style.display = "";
  if (lastState) render(lastState);
});

document.getElementById("logout-admin-btn")?.addEventListener("click", () => {
  authed = false;
  socket.data = {};
  socket.disconnect();
  sessionStorage.clear();
  location.reload();
});

socket.on("state", (state) => {
  lastState = state;
  if (!presets.length && Array.isArray(state.presets)) initPresets(state.presets);
  if (authed) render(state);
});

socket.on("admin:presets-updated", ({ ok, presets: p }) => {
  if (!ok) return;
  presets = p;
  renderPresetSelect();
  // Re-sync hint si el set seleccionado fue el que cambió
  const current = presets.find((x) => x.id === presetId);
  if (current) presetHint.textContent = current.hint || "Edita emoji, nombre y significado para que coincidan con la pregunta.";
  renderPresetsEditor();
  // Marcar botones de guardar como confirmados
  presetsEditor.querySelectorAll(".pe-save").forEach((btn) => {
    btn.textContent = "✓ Guardado";
    btn.style.background = "#16a34a";
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = "Guardar set";
      btn.style.background = "";
    }, 2000);
  });
  showToast("Set guardado ✓");
});

socket.on("vote-pulse", ({ name, emoji }) => { if (authed) showToast(`${name} votó ${emoji}`); });
socket.on("error-msg",  (msg) => { adminError.textContent = msg; mazosError.textContent = msg; });

// ── Historial ─────────────────────────────────────────────────────────────
function renderHistory(history) {
  if (!historyList || !historyCount) return;
  historyCount.textContent = `${history.length} pregunta${history.length !== 1 ? "s" : ""} registrada${history.length !== 1 ? "s" : ""}`;
  historyList.innerHTML = "";
  if (!history.length) {
    historyList.innerHTML = `<div class="info-box" style="text-align:center;padding:24px">
      Aún no hay preguntas en el historial. Se registran automáticamente al publicar una nueva pregunta o al pulsar "Quitar pregunta".
    </div>`;
    return;
  }
  history.forEach((q, qi) => {
    const date = new Date(q.closedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    const card = document.createElement("div");
    card.className = "card history-card";
    const barsHtml = q.emoticons.map((emo, i) => {
      const count = q.counts[emo.id] || 0;
      const pct   = q.totalVotes ? Math.round((count / q.totalVotes) * 100) : 0;
      const voters = (q.voters[emo.id] || []).map((v) =>
        v.empresa ? `${escapeHtml(v.name)} (${escapeHtml(v.empresa)})` : escapeHtml(v.name)
      ).join(", ");
      return `
        <div class="bar-row" style="margin-bottom:10px">
          <div class="bar-meta">
            <strong>${emo.emoji} ${escapeHtml(emo.label)}</strong>
            <span>${count} voto${count !== 1 ? "s" : ""} · ${pct}%</span>
          </div>
          <div class="bar-track"><div class="bar-fill tone-${i}" style="width:${pct}%"></div></div>
          <div class="names" style="margin-top:4px">${voters || "Sin votos"}</div>
        </div>`;
    }).join("");
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
        <div>
          <span class="history-num">#${qi + 1}</span>
          <h3 style="margin:4px 0 0;font-size:16px">${escapeHtml(q.text)}</h3>
        </div>
        <span style="font-size:12px;color:var(--granite);white-space:nowrap">🕐 ${date} · ${q.totalVotes} voto${q.totalVotes !== 1 ? "s" : ""}</span>
      </div>
      ${barsHtml}
    `;
    historyList.appendChild(card);
  });
}

// Exportar PDF
exportPdfBtn && exportPdfBtn.addEventListener("click", () => {
  const history = lastState && lastState.history ? lastState.history : [];
  if (!history.length) { showToast("No hay preguntas en el historial."); return; }

  const sessionDate = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  const questionsHtml = history.map((q, qi) => {
    const date = new Date(q.closedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    const barsHtml = q.emoticons.map((emo) => {
      const count = q.counts[emo.id] || 0;
      const pct   = q.totalVotes ? Math.round((count / q.totalVotes) * 100) : 0;
      const voters = (q.voters[emo.id] || []).map((v) =>
        v.empresa ? `${v.name} (${v.empresa})` : v.name
      ).join(", ");
      return `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;font-weight:600">
            <span>${emo.emoji} ${emo.label}</span>
            <span>${count} · ${pct}%</span>
          </div>
          <div style="background:#e5e7eb;border-radius:4px;height:10px;margin:4px 0">
            <div style="background:#c8102e;border-radius:4px;height:10px;width:${pct}%"></div>
          </div>
          <div style="font-size:11px;color:#666">${voters || "Sin votos"}</div>
        </div>`;
    }).join("");
    return `
      <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <strong style="font-size:15px;color:#c8102e">#${qi + 1}</strong>
          <span style="font-size:11px;color:#888">${date} · ${q.totalVotes} votos</span>
        </div>
        <h3 style="margin:0 0 14px;font-size:17px">${q.text}</h3>
        ${barsHtml}
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>Resultados BNI · ${sessionDate}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
      h1   { color: #c8102e; margin-bottom: 4px; }
      .sub { color: #666; font-size: 13px; margin-bottom: 32px; }
      @media print { body { padding: 20px; } }
    </style>
  </head><body>
    <h1>BNI · Resultados de la sesión</h1>
    <p class="sub">${sessionDate} · ${history.length} pregunta${history.length !== 1 ? "s" : ""}</p>
    ${questionsHtml}
    <p style="font-size:11px;color:#aaa;margin-top:20px;border-top:1px solid #eee;padding-top:10px">
      Generado por Plataforma BNI Emoticones
    </p>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
});

clearHistoryBtn && clearHistoryBtn.addEventListener("click", () => {
  if (!confirm("¿Limpiar todo el historial de esta sesión?")) return;
  socket.emit("admin:clear-history");
});
