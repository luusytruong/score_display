(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("assets/js/injected.js");
  script.onload = script.remove;
  document.documentElement.appendChild(script);
})();

window.addEventListener("message", async (event) => {
  if (event.data?.source === "page-script") {
    const question = event.data.payload[0];
    await setStorage("question", question);
  }
});

async function setStorage(key, data) {
  if (!chrome?.storage?.local) return false;
  try {
    await chrome.storage.local.set({ [key]: data });
    return true;
  } catch {
    return false;
  }
}
