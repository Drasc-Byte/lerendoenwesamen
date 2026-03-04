let signs = [];

const defaultBoaData = {
  basic: {
    mc: [
      {
        question: "Wanneer mag een BOA een bevoegdheid inzetten?",
        options: [
          "Alleen met wettelijke grondslag, proportionaliteit en subsidiariteit",
          "Altijd wanneer iemand niet meewerkt",
          "Alleen na goedkeuring van een collega",
          "Nooit zonder proces-verbaal"
        ],
        correctIndex: 0,
        explanation: "Bevoegd gebruik vereist wettelijke basis en een zorgvuldige afweging."
      }
    ],
    written: [
      {
        question: "Noem in eigen woorden het verschil tussen proportionaliteit en subsidiariteit.",
        modelAnswer: "Proportionaliteit betekent dat het middel in verhouding staat tot het doel. Subsidiariteit betekent dat je kiest voor het minst ingrijpende middel dat effectief is."
      }
    ]
  },
  ov: {
    mc: [
      {
        question: "Wat is bij een incident in het OV de eerste prioriteit?",
        options: [
          "Veiligheid van reizigers en personeel borgen",
          "Direct uitschrijven van boetes",
          "Alleen filmen voor bewijs",
          "Wachten tot het incident vanzelf stopt"
        ],
        correctIndex: 0,
        explanation: "Veiligheid gaat altijd voor handhaving en afhandeling."
      }
    ],
    written: [
      {
        question: "Beschrijf hoe je een conflict op een perron de-escalerend benadert.",
        modelAnswer: "Blijf rustig, positioneer veilig, spreek duidelijk aan, scheid partijen indien nodig, roep ondersteuning in en leg feiten achteraf objectief vast."
      }
    ]
  }
};

const state = {
  track: "traffic",
  mode: "flashcards",
  filtered: [],
  cardIndex: 0,
  matchingPairs: [],
  selectedLeft: null,
  selectedRight: null,
  matchesFound: 0,
  score: 0,
  boa: {
    basic: {
      mode: "mc",
      data: { mc: [], written: [] },
      mc: { index: 0, score: 0, answered: false, shuffled: [] },
      written: { index: 0 }
    },
    ov: {
      mode: "mc",
      data: { mc: [], written: [] },
      mc: { index: 0, score: 0, answered: false, shuffled: [] },
      written: { index: 0 }
    }
  }
};

const refs = {
  trackTraffic: document.getElementById("track-traffic"),
  trackBoaBasic: document.getElementById("track-boa-basic"),
  trackBoaOv: document.getElementById("track-boa-ov"),
  trafficView: document.getElementById("traffic-view"),
  boaBasicView: document.getElementById("boa-basic-view"),
  boaOvView: document.getElementById("boa-ov-view"),

  categorySelect: document.getElementById("category-select"),
  searchInput: document.getElementById("search-input"),
  pairCount: document.getElementById("pair-count"),
  flashcardsTab: document.getElementById("flashcards-tab"),
  matchingTab: document.getElementById("matching-tab"),
  flashcardsView: document.getElementById("flashcards-view"),
  matchingView: document.getElementById("matching-view"),
  flashcard: document.getElementById("flashcard"),
  cardCounter: document.getElementById("flashcard-counter"),
  dataStatus: document.getElementById("data-status"),
  signImage: document.getElementById("sign-image"),
  signCode: document.getElementById("sign-code"),
  signMeaning: document.getElementById("sign-meaning"),
  prevCard: document.getElementById("prev-card"),
  nextCard: document.getElementById("next-card"),
  flipCard: document.getElementById("flip-card"),
  shuffleCards: document.getElementById("shuffle-cards"),
  leftColumn: document.getElementById("left-column"),
  rightColumn: document.getElementById("right-column"),
  matchingScore: document.getElementById("matching-score"),
  newRound: document.getElementById("new-round"),

  boaBasicMeta: document.getElementById("boa-basic-meta"),
  boaBasicModeMc: document.getElementById("boa-basic-mode-mc"),
  boaBasicModeWritten: document.getElementById("boa-basic-mode-written"),
  boaBasicMcView: document.getElementById("boa-basic-mc-view"),
  boaBasicWrittenView: document.getElementById("boa-basic-written-view"),
  boaBasicQuestion: document.getElementById("boa-basic-question"),
  boaBasicOptions: document.getElementById("boa-basic-options"),
  boaBasicFeedback: document.getElementById("boa-basic-feedback"),
  boaBasicNext: document.getElementById("boa-basic-next"),
  boaBasicReset: document.getElementById("boa-basic-reset"),
  boaBasicWrittenQuestion: document.getElementById("boa-basic-written-question"),
  boaBasicWrittenAnswer: document.getElementById("boa-basic-written-answer"),
  boaBasicWrittenFeedback: document.getElementById("boa-basic-written-feedback"),
  boaBasicShowModel: document.getElementById("boa-basic-show-model"),
  boaBasicWrittenNext: document.getElementById("boa-basic-written-next"),
  boaBasicWrittenReset: document.getElementById("boa-basic-written-reset"),

  boaOvMeta: document.getElementById("boa-ov-meta"),
  boaOvModeMc: document.getElementById("boa-ov-mode-mc"),
  boaOvModeWritten: document.getElementById("boa-ov-mode-written"),
  boaOvMcView: document.getElementById("boa-ov-mc-view"),
  boaOvWrittenView: document.getElementById("boa-ov-written-view"),
  boaOvQuestion: document.getElementById("boa-ov-question"),
  boaOvOptions: document.getElementById("boa-ov-options"),
  boaOvFeedback: document.getElementById("boa-ov-feedback"),
  boaOvNext: document.getElementById("boa-ov-next"),
  boaOvReset: document.getElementById("boa-ov-reset"),
  boaOvWrittenQuestion: document.getElementById("boa-ov-written-question"),
  boaOvWrittenAnswer: document.getElementById("boa-ov-written-answer"),
  boaOvWrittenFeedback: document.getElementById("boa-ov-written-feedback"),
  boaOvShowModel: document.getElementById("boa-ov-show-model"),
  boaOvWrittenNext: document.getElementById("boa-ov-written-next"),
  boaOvWrittenReset: document.getElementById("boa-ov-written-reset")
};

function getBoaRefs(module) {
  return module === "basic"
    ? {
        meta: refs.boaBasicMeta,
        modeMcBtn: refs.boaBasicModeMc,
        modeWrittenBtn: refs.boaBasicModeWritten,
        mcView: refs.boaBasicMcView,
        writtenView: refs.boaBasicWrittenView,
        mcQuestion: refs.boaBasicQuestion,
        mcOptions: refs.boaBasicOptions,
        mcFeedback: refs.boaBasicFeedback,
        writtenQuestion: refs.boaBasicWrittenQuestion,
        writtenAnswer: refs.boaBasicWrittenAnswer,
        writtenFeedback: refs.boaBasicWrittenFeedback
      }
    : {
        meta: refs.boaOvMeta,
        modeMcBtn: refs.boaOvModeMc,
        modeWrittenBtn: refs.boaOvModeWritten,
        mcView: refs.boaOvMcView,
        writtenView: refs.boaOvWrittenView,
        mcQuestion: refs.boaOvQuestion,
        mcOptions: refs.boaOvOptions,
        mcFeedback: refs.boaOvFeedback,
        writtenQuestion: refs.boaOvWrittenQuestion,
        writtenAnswer: refs.boaOvWrittenAnswer,
        writtenFeedback: refs.boaOvWrittenFeedback
      };
}

function switchTrack(track) {
  state.track = track;
  const isTraffic = track === "traffic";
  const isBoaBasic = track === "boa-basic";
  const isBoaOv = track === "boa-ov";

  refs.trackTraffic.classList.toggle("active", isTraffic);
  refs.trackBoaBasic.classList.toggle("active", isBoaBasic);
  refs.trackBoaOv.classList.toggle("active", isBoaOv);

  refs.trafficView.classList.toggle("active", isTraffic);
  refs.boaBasicView.classList.toggle("active", isBoaBasic);
  refs.boaOvView.classList.toggle("active", isBoaOv);
}

function switchBoaMode(module, mode) {
  const m = state.boa[module];
  m.mode = mode;
  const r = getBoaRefs(module);
  const isMc = mode === "mc";
  r.modeMcBtn.classList.toggle("active", isMc);
  r.modeWrittenBtn.classList.toggle("active", !isMc);
  r.mcView.classList.toggle("active", isMc);
  r.writtenView.classList.toggle("active", !isMc);
  renderBoa(module);
}

function setBoaMeta(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  if (m.mode === "mc") {
    const total = m.data.mc.length;
    const current = total ? m.mc.index + 1 : 0;
    r.meta.textContent = `Meerkeuze ${current}/${total} | Score: ${m.mc.score}`;
  } else {
    const total = m.data.written.length;
    const current = total ? m.written.index + 1 : 0;
    r.meta.textContent = `Schriftelijk ${current}/${total}`;
  }
}

function renderBoaMc(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  const q = m.data.mc[m.mc.index];
  if (!q) {
    r.mcQuestion.textContent = "Geen meerkeuzevragen geladen.";
    r.mcOptions.innerHTML = "";
    r.mcFeedback.textContent = "";
    return;
  }

  r.mcQuestion.textContent = q.question;
  r.mcOptions.innerHTML = "";
  if (!m.mc.answered) {
    r.mcFeedback.textContent = "Kies het beste antwoord.";
  }

  if (!Array.isArray(m.mc.shuffled) || m.mc.shuffled.length !== q.options.length) {
    m.mc.shuffled = q.options.map((_, idx) => idx);
    m.mc.shuffled = shuffle(m.mc.shuffled);
  }

  m.mc.shuffled.forEach((originalIdx, shownIdx) => {
    const opt = q.options[originalIdx];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option";
    btn.textContent = opt;
    btn.disabled = m.mc.answered;
    btn.addEventListener("click", () => answerBoaMc(module, shownIdx));
    r.mcOptions.append(btn);
  });
}

function answerBoaMc(module, selected) {
  const m = state.boa[module];
  if (m.mc.answered) {
    return;
  }

  const r = getBoaRefs(module);
  const q = m.data.mc[m.mc.index];
  const buttons = [...r.mcOptions.querySelectorAll("button.quiz-option")];
  buttons.forEach((b) => (b.disabled = true));

  const shownCorrectIndex = m.mc.shuffled.indexOf(q.correctIndex);
  const correctBtn = buttons[shownCorrectIndex];
  if (correctBtn) {
    correctBtn.classList.add("correct");
  }

  if (selected === shownCorrectIndex) {
    m.mc.score += 1;
    r.mcFeedback.textContent = "Goed antwoord.";
  } else {
    const selectedBtn = buttons[selected];
    if (selectedBtn) {
      selectedBtn.classList.add("wrong");
    }
    const extra = q.explanation ? ` ${q.explanation}` : "";
    r.mcFeedback.textContent = `Onjuist. Correct: ${q.options[q.correctIndex]}.${extra}`;
  }

  m.mc.answered = true;
  setBoaMeta(module);
}

function nextBoaMc(module) {
  const m = state.boa[module];
  if (m.mc.index < m.data.mc.length - 1) {
    m.mc.index += 1;
    m.mc.answered = false;
    m.mc.shuffled = [];
    renderBoa(module);
    return;
  }
  const r = getBoaRefs(module);
  r.mcFeedback.textContent = `Einde set. Eindscore: ${m.mc.score}/${m.data.mc.length}.`;
}

function resetBoaMc(module) {
  const m = state.boa[module];
  m.mc.index = 0;
  m.mc.score = 0;
  m.mc.answered = false;
  m.mc.shuffled = [];
  renderBoa(module);
}

function renderBoaWritten(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  const q = m.data.written[m.written.index];
  if (!q) {
    r.writtenQuestion.textContent = "Geen schriftelijke vragen geladen.";
    r.writtenFeedback.textContent = "";
    return;
  }

  r.writtenQuestion.textContent = q.question;
  r.writtenFeedback.textContent = "Formuleer je antwoord en controleer met het voorbeeldantwoord.";
}

function showBoaModelAnswer(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  const q = m.data.written[m.written.index];
  if (!q) {
    return;
  }
  r.writtenFeedback.textContent = `Voorbeeldantwoord: ${q.modelAnswer}`;
}

function nextBoaWritten(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  if (m.written.index < m.data.written.length - 1) {
    m.written.index += 1;
    r.writtenAnswer.value = "";
    renderBoa(module);
    return;
  }
  r.writtenFeedback.textContent = "Einde schriftelijke set bereikt.";
}

function resetBoaWritten(module) {
  const m = state.boa[module];
  const r = getBoaRefs(module);
  m.written.index = 0;
  r.writtenAnswer.value = "";
  renderBoa(module);
}

function renderBoa(module) {
  const m = state.boa[module];
  setBoaMeta(module);
  if (m.mode === "mc") {
    renderBoaMc(module);
  } else {
    renderBoaWritten(module);
  }
}

async function loadBoaModule(module, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    state.boa[module].data.mc = Array.isArray(payload.mc) ? payload.mc : [];
    state.boa[module].data.written = Array.isArray(payload.written) ? payload.written : [];
  } catch (_error) {
    state.boa[module].data = JSON.parse(JSON.stringify(defaultBoaData[module]));
  }

  state.boa[module].mc.index = 0;
  state.boa[module].mc.score = 0;
  state.boa[module].mc.answered = false;
  state.boa[module].mc.shuffled = [];
  state.boa[module].written.index = 0;
  renderBoa(module);
}

function commonsImageForCode(code) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/Nederlands_verkeersbord_${encodeURIComponent(code)}.svg`;
}

function enrichSigns(rawSigns) {
  return rawSigns.map((sign) => ({
    ...sign,
    image: sign.image || commonsImageForCode(sign.code)
  }));
}

function uniqueCategories() {
  return ["Alle categorieen", ...new Set(signs.map((sign) => sign.category))];
}

function fillCategorySelect() {
  const previous = refs.categorySelect.value || "Alle categorieen";
  refs.categorySelect.innerHTML = uniqueCategories()
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");

  if ([...refs.categorySelect.options].some((option) => option.value === previous)) {
    refs.categorySelect.value = previous;
  }
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyFilters() {
  const category = refs.categorySelect.value;
  const query = refs.searchInput.value.trim().toLowerCase();

  state.filtered = signs.filter((sign) => {
    const categoryMatch = category === "Alle categorieen" || sign.category === category;
    const queryMatch =
      query.length === 0 ||
      sign.code.toLowerCase().includes(query) ||
      sign.name.toLowerCase().includes(query) ||
      sign.meaning.toLowerCase().includes(query);

    return categoryMatch && queryMatch;
  });

  state.cardIndex = 0;
  renderFlashcard();
  setupMatchingRound();
}

function renderFlashcard() {
  refs.flashcard.classList.remove("flipped");

  if (state.filtered.length === 0) {
    refs.cardCounter.textContent = "Geen resultaten. Pas je filters aan.";
    refs.signCode.textContent = "-";
    refs.signMeaning.textContent = "Gebruik een andere categorie of zoekterm.";
    refs.signImage.style.display = "none";
    refs.signImage.removeAttribute("src");
    return;
  }

  const card = state.filtered[state.cardIndex];
  refs.cardCounter.textContent = `${state.cardIndex + 1} van ${state.filtered.length}`;
  refs.signCode.textContent = card.code;
  refs.signMeaning.textContent = card.meaning;

  refs.signImage.style.display = "block";
  refs.signImage.src = card.image;
  refs.signImage.alt = `Bord ${card.code}`;
}

function nextCard(step) {
  if (state.filtered.length === 0) {
    return;
  }

  const total = state.filtered.length;
  state.cardIndex = (state.cardIndex + step + total) % total;
  renderFlashcard();
}

function switchMode(mode) {
  const flashActive = mode === "flashcards";
  refs.flashcardsTab.classList.toggle("active", flashActive);
  refs.matchingTab.classList.toggle("active", !flashActive);
  refs.flashcardsView.classList.toggle("active", flashActive);
  refs.matchingView.classList.toggle("active", !flashActive);
}

function renderScore() {
  const total = state.matchingPairs.length;
  refs.matchingScore.textContent = `Score: ${state.score} | Goed: ${state.matchesFound}/${total}`;
}

function clearSelections() {
  state.selectedLeft = null;
  state.selectedRight = null;
}

function isLocked(id) {
  return state.matchingPairs.find((pair) => pair.id === id)?.matched;
}

function buildMatchButton(pair, side) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "match-item";
  btn.dataset.side = side;
  btn.dataset.id = pair.id;

  if (side === "left") {
    const wrap = document.createElement("span");
    wrap.className = "match-item-wrap";

    const img = document.createElement("img");
    img.className = "match-thumb";
    img.src = pair.image;
    img.alt = `Bord ${pair.code}`;
    img.onerror = () => {
      img.style.display = "none";
    };

    const label = document.createElement("span");
    label.textContent = pair.code;

    wrap.append(img, label);
    btn.append(wrap);
  } else {
    btn.textContent = pair.meaning;
  }

  if (isLocked(pair.id)) {
    btn.classList.add("correct");
    btn.disabled = true;
  }

  if (side === "left" && state.selectedLeft === pair.id) {
    btn.classList.add("active");
  }

  if (side === "right" && state.selectedRight === pair.id) {
    btn.classList.add("active");
  }

  return btn;
}

function renderMatching() {
  refs.leftColumn.innerHTML = "";
  refs.rightColumn.innerHTML = "";

  const leftList = state.matchingPairs;
  const rightList = shuffle(state.matchingPairs);

  leftList.forEach((pair) => refs.leftColumn.append(buildMatchButton(pair, "left")));
  rightList.forEach((pair) => refs.rightColumn.append(buildMatchButton(pair, "right")));

  renderScore();
}

function feedbackWrong(id, side) {
  const selector = `.match-item[data-side="${side}"][data-id="${id}"]`;
  const node = document.querySelector(selector);
  if (!node) {
    return;
  }

  node.classList.add("wrong");
  setTimeout(() => node.classList.remove("wrong"), 450);
}

function tryMatch() {
  if (!state.selectedLeft || !state.selectedRight) {
    return;
  }

  if (state.selectedLeft === state.selectedRight) {
    const pair = state.matchingPairs.find((item) => item.id === state.selectedLeft);
    if (pair && !pair.matched) {
      pair.matched = true;
      state.matchesFound += 1;
      state.score += 1;
    }
  } else {
    feedbackWrong(state.selectedLeft, "left");
    feedbackWrong(state.selectedRight, "right");
  }

  clearSelections();
  renderMatching();
}

function setupMatchingRound() {
  const desiredPairs = Number(refs.pairCount.value);
  const source = state.filtered.length > 0 ? state.filtered : signs;
  const count = Math.min(desiredPairs, source.length);

  state.matchingPairs = shuffle(source)
    .slice(0, count)
    .map((item, idx) => ({
      id: `pair-${idx + 1}`,
      code: item.code,
      meaning: item.meaning,
      image: item.image,
      matched: false
    }));

  clearSelections();
  state.matchesFound = 0;
  state.score = 0;
  renderMatching();
}

async function tryLoadFromApi() {
  const response = await fetch("/api/signs");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.signs || payload.signs.length === 0) {
    throw new Error("No signs returned");
  }

  signs = enrichSigns(payload.signs);

  const dateText = payload.retrievedAt ? new Date(payload.retrievedAt).toLocaleString("nl-NL") : "onbekend";
  const sourceText = payload.sourceName || "externe bron";
  const statusText = payload.sourceStatus ? ` (${payload.sourceStatus})` : "";
  refs.dataStatus.textContent = `${signs.length} borden geladen. Bron: ${sourceText}${statusText}. Laatst opgehaald: ${dateText}.`;
}

async function tryLoadLocalDataset() {
  const response = await fetch("/data/signs.nl.json");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.signs || payload.signs.length === 0) {
    throw new Error("Lege lokale dataset");
  }

  signs = enrichSigns(payload.signs);
  refs.dataStatus.textContent = `${signs.length} borden geladen vanuit lokale dataset.`;
}

async function loadSigns() {
  try {
    await tryLoadFromApi();
  } catch (_apiError) {
    try {
      await tryLoadLocalDataset();
    } catch (_localError) {
      signs = [];
      refs.dataStatus.textContent = "Data laden mislukt. Controleer of je via npm start draait.";
    }
  }

  fillCategorySelect();
  applyFilters();
}

refs.signImage.addEventListener("error", () => {
  refs.signImage.style.display = "none";
});

refs.trackTraffic.addEventListener("click", () => switchTrack("traffic"));
refs.trackBoaBasic.addEventListener("click", () => switchTrack("boa-basic"));
refs.trackBoaOv.addEventListener("click", () => switchTrack("boa-ov"));

refs.boaBasicModeMc.addEventListener("click", () => switchBoaMode("basic", "mc"));
refs.boaBasicModeWritten.addEventListener("click", () => switchBoaMode("basic", "written"));
refs.boaBasicNext.addEventListener("click", () => nextBoaMc("basic"));
refs.boaBasicReset.addEventListener("click", () => resetBoaMc("basic"));
refs.boaBasicShowModel.addEventListener("click", () => showBoaModelAnswer("basic"));
refs.boaBasicWrittenNext.addEventListener("click", () => nextBoaWritten("basic"));
refs.boaBasicWrittenReset.addEventListener("click", () => resetBoaWritten("basic"));

refs.boaOvModeMc.addEventListener("click", () => switchBoaMode("ov", "mc"));
refs.boaOvModeWritten.addEventListener("click", () => switchBoaMode("ov", "written"));
refs.boaOvNext.addEventListener("click", () => nextBoaMc("ov"));
refs.boaOvReset.addEventListener("click", () => resetBoaMc("ov"));
refs.boaOvShowModel.addEventListener("click", () => showBoaModelAnswer("ov"));
refs.boaOvWrittenNext.addEventListener("click", () => nextBoaWritten("ov"));
refs.boaOvWrittenReset.addEventListener("click", () => resetBoaWritten("ov"));

refs.categorySelect.addEventListener("change", applyFilters);
refs.searchInput.addEventListener("input", applyFilters);
refs.pairCount.addEventListener("change", setupMatchingRound);
refs.flashcardsTab.addEventListener("click", () => switchMode("flashcards"));
refs.matchingTab.addEventListener("click", () => switchMode("matching"));
refs.prevCard.addEventListener("click", () => nextCard(-1));
refs.nextCard.addEventListener("click", () => nextCard(1));
refs.flipCard.addEventListener("click", () => refs.flashcard.classList.toggle("flipped"));
refs.shuffleCards.addEventListener("click", () => {
  state.filtered = shuffle(state.filtered);
  state.cardIndex = 0;
  renderFlashcard();
});

refs.leftColumn.addEventListener("click", (event) => {
  const button = event.target.closest("button.match-item");
  if (!button || button.disabled) {
    return;
  }

  state.selectedLeft = button.dataset.id;
  renderMatching();
  tryMatch();
});

refs.rightColumn.addEventListener("click", (event) => {
  const button = event.target.closest("button.match-item");
  if (!button || button.disabled) {
    return;
  }

  state.selectedRight = button.dataset.id;
  renderMatching();
  tryMatch();
});

refs.newRound.addEventListener("click", setupMatchingRound);

switchTrack("traffic");
switchMode("flashcards");
switchBoaMode("basic", "mc");
switchBoaMode("ov", "mc");
loadBoaModule("basic", "/data/boa-basic.json");
loadBoaModule("ov", "/data/boa-ov.json");
fillCategorySelect();
applyFilters();
loadSigns();
