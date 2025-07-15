// hàm chuyển json thành html

function generateFormattedHTMLFromQuizJSON(jsonString) {
  let data = [];
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON không hợp lệ:", e);
    return "";
  }

  let html = '<div style="font-family: Arial; line-height: 1.6;">';

  data.forEach((item, index) => {
    const questionText = stripHtml(item.question_direction || "");
    html += `<p><strong>Câu ${index + 1}:</strong> ${questionText}</p>`;

    // Hiển thị các lựa chọn
    if (item.answer_option && item.answer_option.length > 0) {
      item.answer_option.forEach((opt, i) => {
        const label =
          item.question_type === "checkbox"
            ? String.fromCharCode(65 + i)
            : getLabelByType(item, i);
        html += `<p style="margin-left: 20px;">${label}. ${stripHtml(
          opt.value
        )}</p>`;
      });
    }

    // Nếu là kiểu kéo thả (drag_drop) không có answer_option ở câu con
    if (item.question_type === "drag_drop" && item.answer_option.length === 0) {
      html += `<p style="margin-left: 20px; font-style: italic;">(Kéo thả đáp án thích hợp vào chỗ trống)</p>`;
    }

    // Nếu là group-radio, chỉ tiêu đề, không lựa chọn
    if (
      item.question_type === "group-radio" &&
      item.answer_option.length === 0
    ) {
      html += `<p style="margin-left: 20px; font-style: italic;">(Nhóm các phát biểu Đúng/Sai)</p>`;
    }
  });

  html += "</div>";
  return html;
}

function stripHtml(html) {
  // Gỡ các tag HTML không cần thiết
  return html
    .replace(/<!--.*?-->/g, "") // remove comments
    .replace(/<\/?[^>]+(>|$)/g, "") // remove tags
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLabelByType(item, index) {
  // Tạo label phù hợp
  if (item.question_type === "group-radio") {
    return ""; // Không dùng label
  }
  return String.fromCharCode(65 + index); // A, B, C...
}
///

document.addEventListener("DOMContentLoaded", async () => {
  const scoreBody = document.getElementById("score-body");
  // Retrieve scores from chrome.storage
  chrome.storage.local.get("scores", (data) => {
    const scores = data.scores || [];
    scoreBody.innerHTML = "";
    scores.forEach((score) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${score.testName}</td>
        <td>${score.score}</td>
        <td>${score.date}</td>
        `;
      scoreBody.appendChild(row);
    });
  });

  const downloadButton = document.getElementById("download-scores");
  let json = await getFromStorage("question");
  json = JSON.stringify(json);
  const htmlContent = generateFormattedHTMLFromQuizJSON(json);

  document.getElementById("show").innerHTML= htmlContent;

  // Handle Download JSON button click
  downloadButton.addEventListener("click", () => {
    downloadJSON(json);
  });
});

// Hàm tải JSON xuống dưới dạng file
function downloadJSON(jsonData, fileName = "data.json") {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
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

async function getFromStorage(key) {
  if (typeof chrome === "undefined" || !chrome.storage) {
    console.error("Error: Not in an extension environment");
    return null;
  }

  try {
    const value = await new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error(`Storage error: ${error.message}`);
          reject(error);
        } else {
          resolve(result[key] || null);
        }
      });
    });
    return value;
  } catch (error) {
    console.error(`Storage operation error - ${key}:`, error.message);
    return null;
  }
}
