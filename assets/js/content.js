(function () {
  if (window.location.hostname !== "lms.ictu.edu.vn") return;
  const script = document.createElement("script");
  script.id = "score-display-script";
  script.src = chrome.runtime.getURL("assets/js/injected.js");
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (event.data?.source === "page-script") {
    const question = event.data.payload[0];
    await setStorage("question", question);
  }
});

async function setStorage(key, data) {
  if (typeof chrome === "undefined" || !chrome.storage) {
    return false;
  }

  try {
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: data }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    return true;
  } catch (error) {
    return false;
  }
}
