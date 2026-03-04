let signs = [];

const defaultBoaData = {
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
      modelAnswer:
        "Proportionaliteit betekent dat het middel in verhouding staat tot het doel. Subsidiariteit betekent dat je kiest voor het minst ingrijpende middel dat effectief is."
    }
  ]
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
    mode: "mc",
    data: { mc: [], written: [] },
    mc: { index: 0, score: 0, answered: false, shuffled: [], order: [] },
    written: { index: 0, order: [] }
  }
};

const refs = {
  trackTraffic: document.getElementById("track-traffic"),
  trackBoa: document.getElementById("track-boa"),
  trafficView: document.getElementById("traffic-view"),
  boaView: document.getElementById("boa-view"),

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

  boaMeta: document.getElementById("boa-meta"),
  boaModeMc: document.getElementById("boa-mode-mc"),
  boaModeWritten: document.getElementById("boa-mode-written"),
  boaMcView: document.getElementById("boa-mc-view"),
  boaWrittenView: document.getElementById("boa-written-view"),
  boaQuestion: document.getElementById("boa-question"),
  boaOptions: document.getElementById("boa-options"),
  boaFeedback: document.getElementById("boa-feedback"),
  boaNext: document.getElementById("boa-next"),
  boaReset: document.getElementById("boa-reset"),
  boaWrittenQuestion: document.getElementById("boa-written-question"),
  boaWrittenAnswer: document.getElementById("boa-written-answer"),
  boaWrittenFeedback: document.getElementById("boa-written-feedback"),
  boaCheckWritten: document.getElementById("boa-check-written"),
  boaShowModel: document.getElementById("boa-show-model"),
  boaWrittenNext: document.getElementById("boa-written-next"),
  boaWrittenReset: document.getElementById("boa-written-reset")
};

function setDataStatus(message) {
  if (refs.dataStatus) {
    refs.dataStatus.textContent = message || "";
  }
}

function switchTrack(track) {
  state.track = track;
  const isTraffic = track === "traffic";

  refs.trackTraffic.classList.toggle("active", isTraffic);
  refs.trackBoa.classList.toggle("active", !isTraffic);

  refs.trafficView.classList.toggle("active", isTraffic);
  refs.boaView.classList.toggle("active", !isTraffic);
}

function switchBoaMode(mode) {
  state.boa.mode = mode;
  const isMc = mode === "mc";
  refs.boaModeMc.classList.toggle("active", isMc);
  refs.boaModeWritten.classList.toggle("active", !isMc);
  refs.boaMcView.classList.toggle("active", isMc);
  refs.boaWrittenView.classList.toggle("active", !isMc);
  renderBoa();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

const STOPWORDS = new Set([
  "de", "het", "een", "en", "van", "voor", "met", "dat", "die", "dit", "dan", "als", "bij", "aan", "in", "op",
  "te", "tot", "om", "of", "is", "zijn", "wordt", "door", "ook", "niet", "wel", "na", "er", "je", "hij", "zij"
]);

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function tokenCloseMatch(modelToken, userToken) {
  if (modelToken === userToken) return true;
  if (modelToken.length >= 6 && userToken.includes(modelToken.slice(0, 5))) return true;
  if (userToken.length >= 6 && modelToken.includes(userToken.slice(0, 5))) return true;
  const dist = levenshteinDistance(modelToken, userToken);
  return dist <= 1;
}

function extractModelKeywords(questionObj) {
  if (Array.isArray(questionObj.keywords) && questionObj.keywords.length > 0) {
    return questionObj.keywords.map((k) => normalizeText(k)).filter((k) => k.length >= 3);
  }

  const words = tokenize(questionObj.modelAnswer || "")
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const unique = [...new Set(words)];
  return unique.slice(0, 14);
}

function mergeBoaData(...payloads) {
  const mcMap = new Map();
  const writtenMap = new Map();

  for (const payload of payloads) {
    const mc = Array.isArray(payload.mc) ? payload.mc : [];
    const written = Array.isArray(payload.written) ? payload.written : [];

    mc.forEach((q) => {
      if (q && q.question && !mcMap.has(q.question)) {
        mcMap.set(q.question, q);
      }
    });

    written.forEach((q) => {
      if (q && q.question && !writtenMap.has(q.question)) {
        writtenMap.set(q.question, q);
      }
    });
  }

  return { mc: [...mcMap.values()], written: [...writtenMap.values()] };
}

function setBoaMeta() {
  const m = state.boa;
  if (m.mode === "mc") {
    const total = m.data.mc.length;
    const current = total ? m.mc.index + 1 : 0;
    refs.boaMeta.textContent = `Meerkeuze ${current}/${total} | Score: ${m.mc.score} | Schriftelijk: ${m.data.written.length}`;
  } else {
    const total = m.data.written.length;
    const current = total ? m.written.index + 1 : 0;
    refs.boaMeta.textContent = `Schriftelijk ${current}/${total} | Meerkeuze totaal: ${m.data.mc.length}`;
  }
}

function renderBoaMc() {
  const m = state.boa;
  const qIdx = m.mc.order[m.mc.index];
  const q = m.data.mc[qIdx];
  if (!q) {
    refs.boaQuestion.textContent = "Geen meerkeuzevragen geladen.";
    refs.boaOptions.innerHTML = "";
    refs.boaFeedback.textContent = "";
    return;
  }

  refs.boaQuestion.textContent = q.question;
  refs.boaOptions.innerHTML = "";
  if (!m.mc.answered) refs.boaFeedback.textContent = "Kies het beste antwoord.";

  if (!Array.isArray(m.mc.shuffled) || m.mc.shuffled.length !== q.options.length) {
    m.mc.shuffled = shuffle(q.options.map((_, i) => i));
  }

  m.mc.shuffled.forEach((origIdx, shownIdx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option";
    btn.textContent = q.options[origIdx];
    btn.disabled = m.mc.answered;
    btn.addEventListener("click", () => answerBoaMc(shownIdx));
    refs.boaOptions.append(btn);
  });
}

function answerBoaMc(selectedShownIdx) {
  const m = state.boa;
  if (m.mc.answered) return;

  const qIdx = m.mc.order[m.mc.index];
  const q = m.data.mc[qIdx];
  const buttons = [...refs.boaOptions.querySelectorAll("button.quiz-option")];
  buttons.forEach((b) => (b.disabled = true));

  const correctShownIdx = m.mc.shuffled.indexOf(q.correctIndex);
  const correctBtn = buttons[correctShownIdx];
  if (correctBtn) correctBtn.classList.add("correct");

  if (selectedShownIdx === correctShownIdx) {
    m.mc.score += 1;
    refs.boaFeedback.textContent = "Goed antwoord.";
  } else {
    const selectedBtn = buttons[selectedShownIdx];
    if (selectedBtn) selectedBtn.classList.add("wrong");
    const extra = q.explanation ? ` ${q.explanation}` : "";
    refs.boaFeedback.textContent = `Onjuist. Correct: ${q.options[q.correctIndex]}.${extra}`;
  }

  m.mc.answered = true;
  setBoaMeta();
}

function nextBoaMc() {
  const m = state.boa;
  if (m.mc.index < m.data.mc.length - 1) {
    m.mc.index += 1;
    m.mc.answered = false;
    m.mc.shuffled = [];
    renderBoa();
    return;
  }
  refs.boaFeedback.textContent = `Einde set. Eindscore: ${m.mc.score}/${m.data.mc.length}.`;
}

function resetBoaMc() {
  const m = state.boa;
  m.mc.index = 0;
  m.mc.score = 0;
  m.mc.answered = false;
  m.mc.shuffled = [];
  m.mc.order = shuffle(m.data.mc.map((_, i) => i));
  renderBoa();
}

function renderBoaWritten() {
  const m = state.boa;
  const qIdx = m.written.order[m.written.index];
  const q = m.data.written[qIdx];
  if (!q) {
    refs.boaWrittenQuestion.textContent = "Geen schriftelijke vragen geladen.";
    refs.boaWrittenFeedback.textContent = "";
    return;
  }

  refs.boaWrittenQuestion.textContent = q.question;
  refs.boaWrittenFeedback.textContent = "Formuleer je antwoord en klik op 'Controleer antwoord'.";
}

function showBoaModelAnswer() {
  const m = state.boa;
  const qIdx = m.written.order[m.written.index];
  const q = m.data.written[qIdx];
  if (!q) return;
  refs.boaWrittenFeedback.textContent = `Voorbeeldantwoord: ${q.modelAnswer}`;
}

function checkBoaWrittenAnswer() {
  const m = state.boa;
  const qIdx = m.written.order[m.written.index];
  const q = m.data.written[qIdx];
  if (!q) return;

  const userAnswer = refs.boaWrittenAnswer.value || "";
  const userTokens = tokenize(userAnswer).filter((t) => t.length >= 4 && !STOPWORDS.has(t));
  if (userTokens.length === 0) {
    refs.boaWrittenFeedback.textContent = "Typ eerst een inhoudelijk antwoord.";
    return;
  }

  const modelKeywords = extractModelKeywords(q);
  const matched = [];
  const missing = [];

  modelKeywords.forEach((kw) => {
    const hasMatch = userTokens.some((ut) => tokenCloseMatch(kw, ut));
    if (hasMatch) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const extra = userTokens.filter((ut) => !modelKeywords.some((kw) => tokenCloseMatch(kw, ut)));
  const coverage = modelKeywords.length === 0 ? 1 : matched.length / modelKeywords.length;
  const pct = Math.round(coverage * 100);
  const verdict =
    coverage >= 0.75
      ? "Sterk antwoord, je zit goed."
      : coverage >= 0.45
        ? "Je zit in de buurt van het juiste antwoord."
        : "Je antwoord is nog te ver van het modelantwoord.";

  const goodLine = matched.length ? `Goed herkend: ${matched.slice(0, 8).join(", ")}.` : "Nog weinig kernpunten herkend.";
  const missLine = missing.length ? `Mist nog: ${missing.slice(0, 8).join(", ")}.` : "Alle kernpunten uit het modelantwoord zijn geraakt.";
  const extraLine = extra.length ? `Mogelijk afwijken: ${extra.slice(0, 6).join(", ")}.` : "";

  refs.boaWrittenFeedback.textContent =
    `${verdict} Beoordeling: ${pct}% kernpunten. ${goodLine} ${missLine}${extraLine ? ` ${extraLine}` : ""} Aanvulling: ${q.modelAnswer}`;
}

function nextBoaWritten() {
  const m = state.boa;
  if (m.written.index < m.data.written.length - 1) {
    m.written.index += 1;
    refs.boaWrittenAnswer.value = "";
    renderBoa();
    return;
  }
  refs.boaWrittenFeedback.textContent = "Einde schriftelijke set bereikt.";
}

function resetBoaWritten() {
  const m = state.boa;
  m.written.index = 0;
  refs.boaWrittenAnswer.value = "";
  m.written.order = shuffle(m.data.written.map((_, i) => i));
  renderBoa();
}

function renderBoa() {
  setBoaMeta();
  if (state.boa.mode === "mc") {
    renderBoaMc();
  } else {
    renderBoaWritten();
  }
}

async function loadBoaData() {
  try {
    const [basicRes, ovRes] = await Promise.all([
      fetch("/data/boa-basic.json"),
      fetch("/data/boa-ov.json")
    ]);

    const basic = basicRes.ok ? await basicRes.json() : { mc: [], written: [] };
    const ov = ovRes.ok ? await ovRes.json() : { mc: [], written: [] };

    state.boa.data = mergeBoaData(basic, ov);
  } catch (_error) {
    state.boa.data = JSON.parse(JSON.stringify(defaultBoaData));
  }

  state.boa.mc.index = 0;
  state.boa.mc.score = 0;
  state.boa.mc.answered = false;
  state.boa.mc.shuffled = [];
  state.boa.mc.order = shuffle(state.boa.data.mc.map((_, i) => i));
  state.boa.written.index = 0;
  state.boa.written.order = shuffle(state.boa.data.written.map((_, i) => i));

  renderBoa();
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
  if (state.filtered.length === 0) return;
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

  if (side === "left" && state.selectedLeft === pair.id) btn.classList.add("active");
  if (side === "right" && state.selectedRight === pair.id) btn.classList.add("active");

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
  if (!node) return;
  node.classList.add("wrong");
  setTimeout(() => node.classList.remove("wrong"), 450);
}

function tryMatch() {
  if (!state.selectedLeft || !state.selectedRight) return;

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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.signs || payload.signs.length === 0) throw new Error("No signs returned");
  signs = enrichSigns(payload.signs);
  setDataStatus("");
}

async function tryLoadLocalDataset() {
  const response = await fetch("/data/signs.nl.json");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload.signs || payload.signs.length === 0) throw new Error("Lege lokale dataset");
  signs = enrichSigns(payload.signs);
  setDataStatus("");
}

async function loadSigns() {
  try {
    await tryLoadFromApi();
  } catch (_apiError) {
    try {
      await tryLoadLocalDataset();
    } catch (_localError) {
      signs = [];
      setDataStatus("");
    }
  }
  fillCategorySelect();
  applyFilters();
}

refs.signImage.addEventListener("error", () => {
  refs.signImage.style.display = "none";
});

refs.trackTraffic.addEventListener("click", () => switchTrack("traffic"));
refs.trackBoa.addEventListener("click", () => switchTrack("boa"));

refs.boaModeMc.addEventListener("click", () => switchBoaMode("mc"));
refs.boaModeWritten.addEventListener("click", () => switchBoaMode("written"));
refs.boaNext.addEventListener("click", nextBoaMc);
refs.boaReset.addEventListener("click", resetBoaMc);
refs.boaCheckWritten.addEventListener("click", checkBoaWrittenAnswer);
refs.boaShowModel.addEventListener("click", showBoaModelAnswer);
refs.boaWrittenNext.addEventListener("click", nextBoaWritten);
refs.boaWrittenReset.addEventListener("click", resetBoaWritten);
refs.boaWrittenAnswer.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    checkBoaWrittenAnswer();
  }
});

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
  if (!button || button.disabled) return;
  state.selectedLeft = button.dataset.id;
  renderMatching();
  tryMatch();
});

refs.rightColumn.addEventListener("click", (event) => {
  const button = event.target.closest("button.match-item");
  if (!button || button.disabled) return;
  state.selectedRight = button.dataset.id;
  renderMatching();
  tryMatch();
});

refs.newRound.addEventListener("click", setupMatchingRound);

switchTrack("traffic");
switchMode("flashcards");
switchBoaMode("mc");
loadBoaData();
fillCategorySelect();
applyFilters();
loadSigns();
