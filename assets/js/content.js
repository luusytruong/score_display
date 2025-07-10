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
