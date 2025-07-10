const debug = (...args) => {
  const mode = false;
  if (mode) console.log(...args);
};

const nameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const segments = path.split("/").filter(Boolean);
    return segments.pop() || path;
  } catch {
    return url;
  }
};

const isNumber = (name) => !isNaN(name) && Number.isInteger(Number(name));
const isWeekTest = (name) => name.includes("week-test");

const createScoreElement = (score = "", week = false) => {
  if (!score) return;
  const scoreElement = document.createElement("span");
  scoreElement.id = "score-display";
  const rawScore = Number(score) / 10;
  const scoreText = isNumber(score)
    ? `${week ? "Điểm cao nhất " : ""}${
        Number.isInteger(rawScore) ? rawScore : rawScore.toFixed(1)
      }`
    : score;
  scoreElement.innerText = scoreText;
  return scoreElement;
};

const waitFor = (
  selector,
  conditionFn,
  onSuccess,
  maxTries = 204,
  intervalTime = 102
) => {
  let tries = 0;
  debug("Waiting for:", selector);
  const interval = setInterval(() => {
    tries++;
    const elements = document.querySelectorAll(selector);
    debug(elements);
    elements.forEach((el) => {
      if (conditionFn(el)) {
        debug("Condition met for:", el);
        clearInterval(interval);
        onSuccess(el);
      }
    });
    if (tries >= maxTries) clearInterval(interval);
  }, intervalTime);
};

const testScoreDisplay = (name, json) => {
  const isNumberName = isNumber(name);
  const isWeekTestName = isWeekTest(name);
  if (!isNumberName && !isWeekTestName) return;

  const score = json?.data || json?.score || "";
  const maxScore = json?.data?.max || "";

  if (isNumberName) {
    waitFor(
      "h4",
      (h4) => h4.innerText === "ĐẠT" && !h4.querySelector("#score-display"),
      (h4) => {
        const scoreElement = createScoreElement(score);
        h4.id = "container-score";
        h4.innerText = "";
        if (scoreElement) {
          scoreElement.className = "score-display";
          h4.appendChild(scoreElement);
        }
      }
    );
  }

  if (isWeekTestName) {
    waitFor(
      "table tr",
      (tr) =>
        tr.innerText.includes("đã làm bài") &&
        tr.querySelector("td:last-child") &&
        !tr.querySelector("#score-display"),
      (tr) => {
        const td = tr.querySelector("td:last-child");
        const scoreElement = createScoreElement(maxScore, true);
        if (scoreElement) td.appendChild(scoreElement);
      }
    );
  }
};

(function injected() {
  // Hook fetch
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    const clone = res.clone();

    const name = nameFromUrl(args[0]);
    const isJSON = res.headers
      .get("content-type")
      ?.includes("application/json");

    if (isJSON) {
      const json = await clone.json();
      testScoreDisplay(name, json);
      debug("✅ Fetch JSON", name);
    }

    return res;
  };

  // Hook XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origOpen.call(this, method, url, ...rest);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      const name = nameFromUrl(this._url);
      const isJSON =
        this.getResponseHeader("content-type")?.includes("application/json");

      if (isJSON) {
        try {
          const json = JSON.parse(this.responseText);
          testScoreDisplay(name, json);
          debug("✅ XHR JSON", name);
        } catch (e) {
          console.warn("❌ JSON parse failed:", e);
        }
      }
    });
    return origSend.apply(this, args);
  };
})();
