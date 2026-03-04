let signs = [];

const boaBasicQuestions = [
  {
    question: "Wat is de juiste volgorde bij het toepassen van bevoegdheden?",
    options: [
      "Eerst subsidiariteit en proportionaliteit toetsen, dan pas handelen",
      "Eerst handelen, daarna juridisch toetsen",
      "Altijd direct verbaliserend optreden",
      "Alleen handelen na toestemming van de meldkamer"
    ],
    correctIndex: 0
  },
  {
    question: "Wat hoort in een proces-verbaal?",
    options: [
      "Feiten, waarnemingen en tijd/plaats concreet vastgelegd",
      "Persoonlijke meningen van de BOA",
      "Alleen de conclusie zonder onderbouwing",
      "Alleen wat de verdachte zegt"
    ],
    correctIndex: 0
  },
  {
    question: "Wanneer is een identiteitscontrole toelaatbaar?",
    options: [
      "Bij een wettelijke grondslag en binnen je bevoegdheid",
      "Altijd als iemand verdacht kijkt",
      "Alleen bij zware misdrijven",
      "Nooit als BOA"
    ],
    correctIndex: 0
  },
  {
    question: "Welke houding past bij professioneel optreden?",
    options: [
      "De-escalerend, duidelijk en respectvol communiceren",
      "Direct confronterend optreden",
      "Alleen schriftelijk communiceren",
      "Geen uitleg geven over je handelen"
    ],
    correctIndex: 0
  },
  {
    question: "Wat betekent proportionaliteit?",
    options: [
      "Het middel moet in verhouding staan tot het doel",
      "Altijd het zwaarste middel gebruiken",
      "Alleen mondeling waarschuwen",
      "Nooit handhaven bij weerstand"
    ],
    correctIndex: 0
  }
];

const boaOvQuestions = [
  {
    question: "Wat is een kernpunt bij controle in het OV?",
    options: [
      "Controle op geldig vervoerbewijs en naleving huisregels",
      "Alleen reizigers informeren over vertrektijden",
      "Alleen bagagecontrole uitvoeren",
      "Controle alleen buiten stations uitvoeren"
    ],
    correctIndex: 0
  },
  {
    question: "Wat doe je bij een oplopend conflict in de trein?",
    options: [
      "De-escaleren, veiligheid borgen en volgens protocol opschalen",
      "Direct iedereen uit de trein zetten",
      "Conflicten negeren tot eindhalte",
      "Alleen filmen zonder optreden"
    ],
    correctIndex: 0
  },
  {
    question: "Waarom is samenwerking met vervoerder en politie belangrijk?",
    options: [
      "Voor snelle en veilige afhandeling van incidenten",
      "Alleen voor administratieve redenen",
      "Omdat BOA's niet zelfstandig mogen optreden",
      "Om boetes te vermijden"
    ],
    correctIndex: 0
  },
  {
    question: "Wat leg je vast na een incident in het OV?",
    options: [
      "Tijd, plaats, betrokkenen en objectieve toedracht",
      "Alleen namen van getuigen",
      "Alleen eigen conclusie zonder feiten",
      "Niets, alleen mondeling melden"
    ],
    correctIndex: 0
  },
  {
    question: "Wat is prioriteit bij toezicht op perrons?",
    options: [
      "Veiligheid, doorstroming en risicogericht handelen",
      "Alleen aanspreken op kleding",
      "Uitsluitend kaartcontrole",
      "Alleen controleren bij spitsdrukte"
    ],
    correctIndex: 0
  }
];

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
  boaBasic: { index: 0, score: 0, answered: false },
  boaOv: { index: 0, score: 0, answered: false }
};

const refs = {
  trackTraffic: document.getElementById("track-traffic"),
  trackBoaBasic: document.getElementById("track-boa-basic"),
  trackBoaOv: document.getElementById("track-boa-ov"),
  trafficView: document.getElementById("traffic-view"),
  boaBasicView: document.getElementById("boa-basic-view"),
  boaOvView: document.getElementById("boa-ov-view"),
  boaBasicMeta: document.getElementById("boa-basic-meta"),
  boaBasicQuestion: document.getElementById("boa-basic-question"),
  boaBasicOptions: document.getElementById("boa-basic-options"),
  boaBasicFeedback: document.getElementById("boa-basic-feedback"),
  boaBasicNext: document.getElementById("boa-basic-next"),
  boaBasicReset: document.getElementById("boa-basic-reset"),
  boaOvMeta: document.getElementById("boa-ov-meta"),
  boaOvQuestion: document.getElementById("boa-ov-question"),
  boaOvOptions: document.getElementById("boa-ov-options"),
  boaOvFeedback: document.getElementById("boa-ov-feedback"),
  boaOvNext: document.getElementById("boa-ov-next"),
  boaOvReset: document.getElementById("boa-ov-reset"),
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
  newRound: document.getElementById("new-round")
};

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

function renderBoaQuiz(type) {
  const isBasic = type === "basic";
  const questions = isBasic ? boaBasicQuestions : boaOvQuestions;
  const quizState = isBasic ? state.boaBasic : state.boaOv;
  const metaRef = isBasic ? refs.boaBasicMeta : refs.boaOvMeta;
  const questionRef = isBasic ? refs.boaBasicQuestion : refs.boaOvQuestion;
  const optionsRef = isBasic ? refs.boaBasicOptions : refs.boaOvOptions;
  const feedbackRef = isBasic ? refs.boaBasicFeedback : refs.boaOvFeedback;

  const current = questions[quizState.index];
  metaRef.textContent = `Vraag ${quizState.index + 1} van ${questions.length} | Score: ${quizState.score}`;
  questionRef.textContent = current.question;
  optionsRef.innerHTML = "";

  current.options.forEach((optionText, idx) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = optionText;
    button.disabled = quizState.answered;
    button.addEventListener("click", () => answerBoaQuestion(type, idx));
    optionsRef.append(button);
  });

  if (!quizState.answered) {
    feedbackRef.textContent = "Kies het beste antwoord.";
  }
}

function answerBoaQuestion(type, chosenIndex) {
  const isBasic = type === "basic";
  const questions = isBasic ? boaBasicQuestions : boaOvQuestions;
  const quizState = isBasic ? state.boaBasic : state.boaOv;
  const optionsRef = isBasic ? refs.boaBasicOptions : refs.boaOvOptions;
  const feedbackRef = isBasic ? refs.boaBasicFeedback : refs.boaOvFeedback;

  if (quizState.answered) {
    return;
  }

  const current = questions[quizState.index];
  const optionButtons = [...optionsRef.querySelectorAll("button.quiz-option")];
  optionButtons.forEach((btn) => (btn.disabled = true));

  const correctButton = optionButtons[current.correctIndex];
  if (correctButton) {
    correctButton.classList.add("correct");
  }

  if (chosenIndex === current.correctIndex) {
    quizState.score += 1;
    feedbackRef.textContent = "Goed antwoord.";
  } else {
    const chosenButton = optionButtons[chosenIndex];
    if (chosenButton) {
      chosenButton.classList.add("wrong");
    }
    feedbackRef.textContent = `Onjuist. Correct: ${current.options[current.correctIndex]}`;
  }

  quizState.answered = true;
  const metaRef = isBasic ? refs.boaBasicMeta : refs.boaOvMeta;
  metaRef.textContent = `Vraag ${quizState.index + 1} van ${questions.length} | Score: ${quizState.score}`;
}

function nextBoaQuestion(type) {
  const isBasic = type === "basic";
  const questions = isBasic ? boaBasicQuestions : boaOvQuestions;
  const quizState = isBasic ? state.boaBasic : state.boaOv;
  const feedbackRef = isBasic ? refs.boaBasicFeedback : refs.boaOvFeedback;

  if (quizState.index < questions.length - 1) {
    quizState.index += 1;
    quizState.answered = false;
    renderBoaQuiz(type);
    return;
  }

  feedbackRef.textContent = `Einde set. Eindscore: ${quizState.score}/${questions.length}.`;
}

function resetBoaQuiz(type) {
  const quizState = type === "basic" ? state.boaBasic : state.boaOv;
  quizState.index = 0;
  quizState.score = 0;
  quizState.answered = false;
  renderBoaQuiz(type);
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
      name: item.name,
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

  const dateText = payload.retrievedAt
    ? new Date(payload.retrievedAt).toLocaleString("nl-NL")
    : "onbekend";

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
refs.boaBasicNext.addEventListener("click", () => nextBoaQuestion("basic"));
refs.boaBasicReset.addEventListener("click", () => resetBoaQuiz("basic"));
refs.boaOvNext.addEventListener("click", () => nextBoaQuestion("ov"));
refs.boaOvReset.addEventListener("click", () => resetBoaQuiz("ov"));
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
renderBoaQuiz("basic");
renderBoaQuiz("ov");
fillCategorySelect();
applyFilters();
loadSigns();
