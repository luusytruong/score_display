function generateOptions(data, i, html) {
  let newHtml = html;
  if (data[i].answer_option && data[i].answer_option.length > 0) {
    data[i].answer_option.forEach((opt, i) => {
      const label =
        data[i].question_type === "checkbox"
          ? String.fromCharCode(65 + i)
          : getLabelByType(data[i], i);
      newHtml += `<p style="margin-left: 16px;"><strong>${label}</strong>. ${stripHtml(
        opt.value
      )}</p>`;
    });
  }
  return newHtml;
}

// hàm chuyển json thành html
function generateFormattedHTMLFromQuizJSON(data) {
  if (!data?.length) return;
  let html = '<div style="font-family: Arial; line-height: 1.6;">';

  let currentId = 0;
  let indexQuestion = 1;
  for (let i = 0; i < data.length; i++) {
    const questionText = stripHtml(data[i].question_direction || "");
    html += `<p class="question-text"><strong>Câu ${indexQuestion}:</strong> ${questionText}</p>`;
    indexQuestion++;
    // lưu giá trị id của câu hỏi hiện tại
    currentId = data[i].id;
    // Nếu là kiểu kéo thả (drag_drop) không có answer_option ở câu con
    if (data[i].question_type === "drag_drop") {
      //nếu là câu hỏi
      if (data[i].answer_option.length !== 0) {
        html += `<p style="margin-left: 16px; font-style: italic;">(Kéo thả đáp án thích hợp vào chỗ trống)</p>`;
        html = generateOptions(data, i, html);
        // render ra đáp án của câu hỏi
        let j = i + 1;
        for (; j < data.length; j++) {
          if (currentId === data[j].group_id) {
            html += `<p><strong>${data[j].question_direction}</strong></p>`;
          } else break;
        }
        i = j - 1;
      }
    } else if (
      data[i].question_type === "group-radio" &&
      data[i].answer_option.length === 0
    ) {
      html += `<p style="margin-left: 16px; font-style: italic;">(Nhóm các phát biểu Đúng/Sai)</p>`;
      let j = i + 1;
      for (; j < data.length; j++) {
        if (currentId === data[j].group_id) {
          html += `<p style="margin-left: 8px;"><strong>${j - i}) ${
            data[j].question_direction
          }</strong></p>`;
          html = generateOptions(data, j, html);
        } else break;
      }
      i = j - 1;
    } else if (data[i].question_type === "group-input") {
      let j = i + 1;
      for (; j < data.length; j++) {
        if (currentId === data[j].group_id) {
          html += `<p style="margin-left: 16px;"><strong>${j - i})</strong> ${
            data[j].question_direction
          }</p>`;
          html = generateOptions(data, j, html);
        } else break;
      }
      i = j - 1;
    }
    // Hiển thị các lựa chọn 4 đáp án ##
    else if (data[i].answer_option.length !== 0)
      html = generateOptions(data, i, html);
    // những loại mới
    else html = generateOptions(data, i, html);
  }

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

document.addEventListener("DOMContentLoaded", async () => {
  const downloadButton = document.getElementById("download-scores");
  let json = await getFromStorage("question");
  const htmlContent = generateFormattedHTMLFromQuizJSON(json) || "no data.";
  // const htmlContent = generateFormattedHTMLFromQuizJSON(TEMP_JSON_DATA);

  document.getElementById("show").innerHTML = htmlContent;

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
