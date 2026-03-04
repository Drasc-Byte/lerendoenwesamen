let signs = [];

const state = {
  mode: "flashcards",
  filtered: [],
  cardIndex: 0,
  matchingPairs: [],
  selectedLeft: null,
  selectedRight: null,
  matchesFound: 0,
  score: 0
};

const refs = {
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

switchMode("flashcards");
fillCategorySelect();
applyFilters();
loadSigns();
