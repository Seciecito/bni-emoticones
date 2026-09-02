const socket = io();

const authCard = document.getElementById("auth-card");
const adminApp = document.getElementById("admin-app");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const questionForm = document.getElementById("question-form");
const questionInput = document.getElementById("question");
const presetSelect = document.getElementById("preset");
const presetHint = document.getElementById("preset-hint");
const emoEditor = document.getElementById("emo-editor");
const addEmoBtn = document.getElementById("add-emo");
const adminError = document.getElementById("admin-error");
const peopleCount = document.getElementById("people-count");
const peopleList = document.getElementById("people-list");
const liveDot = document.getElementById("live-dot");
const statusLabel = document.getElementById("status-label");
const questionText = document.getElementById("question-text");
const voteCount = document.getElementById("vote-count");
const openLabel = document.getElementById("open-label");
const bars = document.getElementById("bars");
const toggleBtn = document.getElementById("toggle-btn");
const resetBtn = document.getElementById("reset-btn");
const clearBtn = document.getElementById("clear-btn");
const toast = document.getElementById("toast");

let authed = false;
let lastState = null;
let presets = [];
let draft = [];
let presetId = "referidos";
let suppressPresetChange = false;

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function percent(count, totalVotes) {
  if (!totalVotes) return 0;
  return Math.round((count / totalVotes) * 100);
}

function clonePreset(id) {
  const preset = presets.find((item) => item.id === id) || presets[0];
  return (preset.emoticons || []).map((item) => ({
    emoji: item.emoji,
    label: item.label,
    meaning: item.meaning,
  }));
}

function markCustomIfEdited() {
  if (presetId === "custom") return;
  const original = presets.find((item) => item.id === presetId);
  if (!original) {
    presetId = "custom";
    return;
  }
  const same =
    original.emoticons.length === draft.length &&
    original.emoticons.every((item, index) => {
      const row = draft[index];
      return (
        item.emoji === row.emoji &&
        item.label === row.label &&
        item.meaning === row.meaning
      );
    });
  if (!same) {
    presetId = "custom";
    suppressPresetChange = true;
    presetSelect.value = "custom";
    presetHint.textContent = "Mazo personalizado para este texto.";
    suppressPresetChange = false;
  }
}

function renderPresetSelect() {
  const previous = presetId;
  presetSelect.innerHTML = "";
  presets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
  const custom = document.createElement("option");
  custom.value = "custom";
  custom.textContent = "Personalizado para este texto";
  presetSelect.appendChild(custom);
  presetSelect.value = previous;
}

function renderEditor() {
  emoEditor.innerHTML = "";
  draft.forEach((row, index) => {
    const wrap = document.createElement("div");
    wrap.className = "emo-edit";
    wrap.innerHTML = `
      <div class="emo-edit-top">
        <input class="emoji" data-field="emoji" data-index="${index}" maxlength="8" value="${escapeHtml(row.emoji)}" aria-label="Emoticón" />
        <input data-field="label" data-index="${index}" maxlength="24" value="${escapeHtml(row.label)}" placeholder="Nombre" aria-label="Nombre" />
        <button class="btn btn-ghost btn-tiny" type="button" data-remove="${index}" ${draft.length <= 2 ? "disabled" : ""}>Quitar</button>
      </div>
      <textarea data-field="meaning" data-index="${index}" maxlength="180" placeholder="Qué significa votar esto en ESTE texto" aria-label="Significado">${escapeHtml(row.meaning)}</textarea>
    `;
    emoEditor.appendChild(wrap);
  });
  addEmoBtn.disabled = draft.length >= 6;
}

function applyPreset(id) {
  if (id === "custom") {
    presetId = "custom";
    presetHint.textContent = "Edita emoji, nombre y significado para que coincidan con el texto.";
    if (!draft.length) draft = clonePreset("referidos");
    renderEditor();
    return;
  }
  presetId = id;
  const preset = presets.find((item) => item.id === id);
  presetHint.textContent = preset
    ? preset.hint
    : "Elige un mazo o edita cada significado.";
  draft = clonePreset(id);
  renderEditor();
}

function collectDraft() {
  return draft.map((row) => ({
    emoji: row.emoji.trim(),
    label: row.label.trim(),
    meaning: row.meaning.trim(),
  }));
}

function render(state) {
  peopleCount.textContent = `${state.participantCount} conectados`;
  liveDot.classList.toggle("off", !state.question.active);

  const hasQuestion = Boolean(state.question.text);
  statusLabel.textContent = !hasQuestion
    ? "Sin texto publicado"
    : state.question.active
      ? "Votación abierta"
      : "Votación cerrada";
  questionText.textContent = hasQuestion
    ? state.question.text
    : "Todavía no hay un texto publicado.";
  voteCount.textContent = `${state.voteCount} votos`;
  openLabel.textContent = state.question.active ? "Abierta" : "Cerrada";
  toggleBtn.textContent = state.question.active ? "Cerrar votación" : "Reabrir votación";
  toggleBtn.disabled = !hasQuestion;

  peopleList.innerHTML = "";
  if (!state.participants.length) {
    peopleList.innerHTML = '<span class="chip">Nadie conectado aún</span>';
  } else {
    state.participants.forEach((p) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = p.name;
      peopleList.appendChild(chip);
    });
  }

  bars.innerHTML = "";
  state.emoticons.forEach((emo, index) => {
    const count = state.counts[emo.id] || 0;
    const names = (state.voters[emo.id] || []).map((v) => escapeHtml(v.name)).join(", ");
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-meta">
        <strong>${emo.emoji} ${escapeHtml(emo.label)}</strong>
        <span>${count} · ${percent(count, total(state))}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill tone-${index}" style="width:${percent(count, total(state))}%"></div></div>
      <p class="lede" style="max-width:none;font-size:12px;margin-top:2px">${escapeHtml(emo.meaning)}</p>
      <div class="names">${names || "Sin votos todavía"}</div>
    `;
    bars.appendChild(row);
  });
}

function total(state) {
  return state.voteCount || 0;
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authError.textContent = "";
  socket.emit("admin:auth", { pin: document.getElementById("pin").value });
});

presetSelect.addEventListener("change", () => {
  if (suppressPresetChange) return;
  applyPreset(presetSelect.value);
});

emoEditor.addEventListener("input", (event) => {
  const field = event.target.getAttribute("data-field");
  const index = Number(event.target.getAttribute("data-index"));
  if (!field || Number.isNaN(index) || !draft[index]) return;
  draft[index][field] = event.target.value;
  markCustomIfEdited();
});

emoEditor.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button || button.disabled) return;
  const index = Number(button.getAttribute("data-remove"));
  draft.splice(index, 1);
  presetId = "custom";
  presetSelect.value = "custom";
  presetHint.textContent = "Mazo personalizado para este texto.";
  renderEditor();
});

addEmoBtn.addEventListener("click", () => {
  if (draft.length >= 6) return;
  draft.push({
    emoji: "⭐",
    label: "",
    meaning: "",
  });
  presetId = "custom";
  presetSelect.value = "custom";
  presetHint.textContent = "Mazo personalizado para este texto.";
  renderEditor();
});

questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminError.textContent = "";
  socket.emit("admin:set-question", {
    text: questionInput.value,
    emoticons: collectDraft(),
    presetId,
  });
});

toggleBtn.addEventListener("click", () => socket.emit("admin:toggle"));
resetBtn.addEventListener("click", () => socket.emit("admin:reset-votes"));
clearBtn.addEventListener("click", () => {
  questionInput.value = "";
  socket.emit("admin:clear-question");
});

socket.on("admin:auth-result", ({ ok, presets: nextPresets }) => {
  if (!ok) {
    authError.textContent = "PIN incorrecto.";
    return;
  }
  authed = true;
  if (Array.isArray(nextPresets) && nextPresets.length) {
    presets = nextPresets;
    renderPresetSelect();
    applyPreset("referidos");
  }
  authCard.classList.add("hidden");
  adminApp.classList.remove("hidden");
  if (lastState) render(lastState);
});

socket.on("state", (state) => {
  lastState = state;
  if (Array.isArray(state.presets) && state.presets.length && !presets.length) {
    presets = state.presets;
    renderPresetSelect();
    applyPreset("referidos");
  }
  if (authed) render(state);
});

socket.on("vote-pulse", ({ name, emoji }) => {
  if (authed) showToast(`${name} votó ${emoji}`);
});

socket.on("error-msg", (msg) => {
  adminError.textContent = msg;
});
