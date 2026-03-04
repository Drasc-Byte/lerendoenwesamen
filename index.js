const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const PRIMARY_SOURCE_URL = "https://www.bijzondereverrichting.nl/regels/borden/";
const WIKI_SOURCE_URL = "https://en.wikipedia.org/wiki/Road_signs_in_the_Netherlands";
const CACHE_MS = 6 * 60 * 60 * 1000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const signCache = {
  timestamp: 0,
  payload: null
};

function categoryFromCode(code) {
  const lead = (code || "").charAt(0).toUpperCase();
  if (lead === "A") return "Snelheid";
  if (lead === "B") return "Voorrang";
  if (lead === "C") return "Verbod";
  if (lead === "D") return "Gebod";
  if (lead === "E") return "Parkeren";
  if (lead === "F") return "Gedrag";
  if (lead === "G") return "Wegtype";
  if (lead === "H") return "Zone";
  if (lead === "J") return "Waarschuwing";
  return "Informatie";
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMeaning(code, name, rawMeaning) {
  const cleanName = cleanText(name || code);
  const cleanMeaning = cleanText(rawMeaning || "");

  if (!cleanMeaning || cleanMeaning.toLowerCase() === cleanName.toLowerCase()) {
    return `Dit verkeersbord betekent: ${cleanName}.`;
  }

  return cleanMeaning;
}

function normalizeSign(input) {
  const code = String(input.code || "").trim().toUpperCase();
  if (!code) {
    return null;
  }

  const name = cleanText(input.name || code);
  const meaning = buildMeaning(code, name, input.meaning);

  return {
    code,
    name: name || code,
    meaning: meaning || name || code,
    category: input.category || categoryFromCode(code),
    image: input.image || ""
  };
}

function imageLikelyMatchesCode(imageUrl, code) {
  if (!imageUrl || !code) {
    return false;
  }

  const upperCode = code.toUpperCase();
  const url = String(imageUrl).toUpperCase();
  return (
    url.includes(`/${upperCode}.`) ||
    url.includes(`_${upperCode}.`) ||
    url.includes(`${upperCode}_`) ||
    url.includes(`BORD_${upperCode}`) ||
    url.includes(`VERKEERSBORD_${upperCode}`)
  );
}

function mergeSigns(...collections) {
  const map = new Map();

  for (const list of collections) {
    for (const rawSign of list) {
      const sign = normalizeSign(rawSign);
      if (!sign) {
        continue;
      }

      const prev = map.get(sign.code) || null;
      map.set(sign.code, {
        code: sign.code,
        name: sign.name || (prev ? prev.name : sign.code),
        meaning: sign.meaning || sign.name || (prev ? prev.meaning : sign.code),
        category: sign.category || (prev ? prev.category : categoryFromCode(sign.code)),
        image:
          (sign.image && imageLikelyMatchesCode(sign.image, sign.code) ? sign.image : "") ||
          (prev ? prev.image : "")
      });
    }
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code, "nl", { numeric: true }));
}

function loadBundledSigns() {
  try {
    const filePath = path.join(ROOT, "data", "signs.nl.json");
    const raw = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    if (Array.isArray(json.signs) && json.signs.length > 0) {
      return mergeSigns(json.signs);9
    }
  } catch (_error) {
    // Fallback handled below.
  }

  return [
    {
      code: "A1",
      name: "Maximumsnelheid",
      meaning: "Je mag niet harder rijden dan de aangegeven snelheid.",
      category: "Snelheid",
      image: ""
    }
  ];
}

const BUNDLED_SIGNS = loadBundledSigns();

function parsePrimarySigns(html) {
  const signs = [];
  const seen = new Set();

  // Prefer exact figure->code->label blocks to avoid image/meaning mismatches.
  const strictRegex =
    /<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/figure>\s*<h4[^>]*id="([A-Z]{1,4}\d+[a-z]?)"[^>]*>\s*\2\s*<\/h4>\s*<h4[^>]*>([\s\S]*?)<\/h4>/gim;
  let strictMatch;

  while ((strictMatch = strictRegex.exec(html)) !== null) {
    const image = new URL(strictMatch[1], PRIMARY_SOURCE_URL).href;
    const code = strictMatch[2].trim().toUpperCase();
    const title = cleanText(strictMatch[3]) || code;
    const key = `${code}|${title}`;

    if (!seen.has(key)) {
      seen.add(key);
      signs.push({
        code,
        name: title,
        meaning: title,
        category: categoryFromCode(code),
        image
      });
    }
  }

  if (signs.length > 0) {
    return signs;
  }

  const images = [];
  const imageRegex = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gim;
  let imageMatch;

  while ((imageMatch = imageRegex.exec(html)) !== null) {
    images.push({
      index: imageMatch.index,
      src: new URL(imageMatch[1], PRIMARY_SOURCE_URL).href
    });
  }

  const fallbackSigns = [];
  const codeRegex = /<h4[^>]*id="([A-Z]{1,4}\d+[a-z]?)"[^>]*>\s*\1\s*<\/h4>\s*<h4[^>]*>([\s\S]*?)<\/h4>/gim;
  let codeMatch;

  while ((codeMatch = codeRegex.exec(html)) !== null) {
    const code = codeMatch[1].trim().toUpperCase();
    const title = cleanText(codeMatch[2]) || code;
    let image = "";

    for (let i = images.length - 1; i >= 0; i -= 1) {
      if (images[i].index < codeMatch.index) {
        image = images[i].src;
        break;
      }
    }

    fallbackSigns.push({
      code,
      name: title,
      meaning: title,
      category: categoryFromCode(code),
      image
    });
  }

  return fallbackSigns;
}

function parseWikiSigns(html) {
  const signs = [];
  const regex = /<li class="gallerybox"[\s\S]*?<a href="\/wiki\/File:([^"]+)"[\s\S]*?<div class="gallerytext">\s*([A-Z]{1,4}\d+[a-z]?)\s*:\s*([\s\S]*?)<\/div>[\s\S]*?<\/li>/gim;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const file = decodeURIComponent(match[1]).replace(/ /g, "_");
    const code = match[2].trim().toUpperCase();
    const text = cleanText(match[3]);

    signs.push({
      code,
      name: text || code,
      meaning: text || code,
      category: categoryFromCode(code),
      image: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`
    });
  }

  return signs;
}

async function fetchLiveSigns() {
  const [primaryResult, wikiResult] = await Promise.allSettled([
    fetch(PRIMARY_SOURCE_URL, {
      headers: {
        "User-Agent": "Rouchelle-study-site/1.0"
      }
    }),
    fetch(WIKI_SOURCE_URL, {
      headers: {
        "User-Agent": "Rouchelle-study-site/1.0"
      }
    })
  ]);

  let primarySigns = [];
  let wikiSigns = [];
  let sourceStatus = [];

  if (primaryResult.status === "fulfilled" && primaryResult.value.ok) {
    const html = await primaryResult.value.text();
    primarySigns = parsePrimarySigns(html);
    sourceStatus.push(`primary:${primarySigns.length}`);
  } else {
    sourceStatus.push("primary:fail");
  }

  if (wikiResult.status === "fulfilled" && wikiResult.value.ok) {
    const html = await wikiResult.value.text();
    wikiSigns = parseWikiSigns(html);
    sourceStatus.push(`wiki:${wikiSigns.length}`);
  } else {
    sourceStatus.push("wiki:fail");
  }

  const merged = mergeSigns(BUNDLED_SIGNS, wikiSigns, primarySigns);
  return {
    signs: merged,
    sourceStatus: sourceStatus.join(", ")
  };
}

function fallbackPayload(reason) {
  return {
    sourceName: "Bundled dataset",
    sourceUrl: "local:data/signs.nl.json",
    retrievedAt: new Date().toISOString(),
    fallback: true,
    reason,
    signs: BUNDLED_SIGNS
  };
}

async function getSignsPayload() {
  const now = Date.now();
  if (signCache.payload && now - signCache.timestamp < CACHE_MS) {
    return signCache.payload;
  }

  try {
    const live = await fetchLiveSigns();
    if (!live.signs || live.signs.length < 100) {
      throw new Error(`Too few signs merged (${live.signs ? live.signs.length : 0})`);
    }

    const payload = {
      sourceName: "Bijzondere Verrichting + Wikipedia + Bundled merge",
      sourceUrl: `${PRIMARY_SOURCE_URL} | ${WIKI_SOURCE_URL}`,
      sourceStatus: live.sourceStatus,
      retrievedAt: new Date().toISOString(),
      fallback: false,
      signs: live.signs
    };

    signCache.payload = payload;
    signCache.timestamp = now;
    return payload;
  } catch (error) {
    const payload = fallbackPayload(error.message);
    signCache.payload = payload;
    signCache.timestamp = now;
    return payload;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function resolvePath(urlPath) {
  const safePath = decodeURIComponent(urlPath.split("?")[0]);
  const target = safePath === "/" ? "/index.html" : safePath;
  const normalized = path.normalize(target).replace(/^([.][.][/\\])+/, "");
  const absolutePath = path.join(ROOT, normalized);

  if (!absolutePath.startsWith(ROOT)) {
    return null;
  }

  return absolutePath;
}

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
        return;
      }

      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("500 Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const requestPath = req.url.split("?")[0];

  if (req.method === "GET" && requestPath === "/healthz") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && requestPath === "/api/signs") {
    const payload = await getSignsPayload();
    sendJson(res, 200, payload);
    return;
  }

  const filePath = resolvePath(req.url);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden");
    return;
  }

  sendFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Study site running at http://localhost:${PORT}`);
});
