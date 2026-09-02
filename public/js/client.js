const socket = io();

const joinCard = document.getElementById("join-card");
const roomCard = document.getElementById("room-card");
const joinForm = document.getElementById("join-form");
const joinError = document.getElementById("join-error");
const nameInput = document.getElementById("name");
const peopleCount = document.getElementById("people-count");
const liveDot = document.getElementById("live-dot");
const statusLabel = document.getElementById("status-label");
const questionText = document.getElementById("question-text");
const waitBox = document.getElementById("wait-box");
const voteBox = document.getElementById("vote-box");
const resultsBox = document.getElementById("results-box");
const emoGrid = document.getElementById("emo-grid");
const bars = document.getElementById("bars");
const voteCount = document.getElementById("vote-count");
const myVote = document.getElementById("my-vote");
const toast = document.getElementById("toast");

let me = null;
let lastState = null;
let myEmoticonId = null;

const savedName = sessionStorage.getItem("emo-name");
if (savedName) nameInput.value = savedName;

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

function percent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function renderEmoticons(state) {
  emoGrid.innerHTML = "";
  state.emoticons.forEach((emo, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `emo tone-${index}${myEmoticonId === emo.id ? " selected" : ""}`;
    btn.innerHTML = `
      <div class="big">${emo.emoji}</div>
      <div>
        <strong>${escapeHtml(emo.label)}</strong>
        <span>${escapeHtml(emo.meaning)}</span>
      </div>
    `;
    btn.addEventListener("click", () => socket.emit("vote", { emoticonId: emo.id }));
    emoGrid.appendChild(btn);
  });
}

function renderBars(state) {
  const totalVotes = state.voteCount || 0;
  bars.innerHTML = "";
  state.emoticons.forEach((emo, index) => {
    const count = state.counts[emo.id] || 0;
    const names = (state.voters[emo.id] || []).map((v) => escapeHtml(v.name)).join(", ");
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-meta">
        <strong>${emo.emoji} ${escapeHtml(emo.label)}</strong>
        <span>${count} · ${percent(count, totalVotes)}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill tone-${index}" style="width:${percent(count, totalVotes)}%"></div></div>
      <div class="names">${names || "Sin votos todavía"}</div>
    `;
    bars.appendChild(row);
  });
}

function applyState(state) {
  lastState = state;
  peopleCount.textContent = `${state.participantCount} conectados`;
  liveDot.classList.toggle("off", !state.question.active);

  if (!me) return;

  const hasQuestion = Boolean(state.question.text);
  statusLabel.textContent = !hasQuestion
    ? "Esperando texto"
    : state.question.active
      ? "Votación abierta"
      : "Votación cerrada";
  questionText.textContent = hasQuestion
    ? state.question.text
    : "El super admin publicará el texto en un momento.";

  waitBox.classList.toggle("hidden", hasQuestion);
  voteBox.classList.toggle("hidden", !hasQuestion || !state.question.active);
  resultsBox.classList.toggle("hidden", !hasQuestion);

  if (hasQuestion && state.question.active) renderEmoticons(state);
  if (hasQuestion) renderBars(state);

  voteCount.textContent = `${state.voteCount} votos`;
  const mine = state.emoticons.find((e) => e.id === myEmoticonId);
  myVote.textContent = mine ? `Tu voto: ${mine.emoji} ${mine.label}` : "";
}

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinError.textContent = "";
  socket.emit("join", { name: nameInput.value });
});

socket.on("joined", ({ name }) => {
  me = name;
  sessionStorage.setItem("emo-name", name);
  joinCard.classList.add("hidden");
  roomCard.classList.remove("hidden");
  if (lastState) applyState(lastState);
});

socket.on("state", (state) => {
  const mine = state.voters && me
    ? Object.entries(state.voters).find(([, list]) => list.some((v) => v.name === me))
    : null;
  myEmoticonId = mine ? mine[0] : null;
  applyState(state);
});

socket.on("vote-pulse", ({ name, emoji }) => {
  if (name !== me) showToast(`${name} votó ${emoji}`);
});

socket.on("error-msg", (msg) => {
  if (!me) joinError.textContent = msg;
  else showToast(msg);
});

socket.on("connect", () => {
  if (savedName && !me) {
    socket.emit("join", { name: savedName });
  }
});
