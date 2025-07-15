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
  // const htmlContent = generateFormattedHTMLFromQuizJSON(json);
  const htmlContent = generateFormattedHTMLFromQuizJSON(TEMP_JSON_DATA);

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
///
const TEMP_JSON_DATA = [
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Số lượng module họ có thể viết trong một ngày</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Mức độ sử dụng lệnh “goto” – càng nhiều thì tay nghề càng yếu&nbsp;</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Số ngôn ngữ lập trình họ biết – càng nhiều thì tay nghề càng cao</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          '<!--StartFragment--><p type="disc"><!--StartFragment--><span>Thời gian họ học đại học</span><!--EndFragment--><o:p></o:p></p><!--EndFragment-->',
      },
    ],
    cdr: 1,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103468,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Theo Dijkstra, điều gì được dùng để đánh giá tay nghề của một lập trình viên?</span></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Ngôn ngữ Python, với cú pháp hiện đại và dễ học</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Ngôn ngữ C++, hỗ trợ lập trình hướng đối tượng</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Các ngôn ngữ bậc thấp như mã máy và hợp ngữ</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Ngôn ngữ Java, thường dùng trong các ứng dụng di động</span><!--EndFragment--></p>",
      },
    ],
    cdr: 1,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103469,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Trong thời kỳ đầu phát triển của tin học, ngôn ngữ lập trình nào được sử dụng phổ biến nhất để viết chương trình điều khiển máy tính?</span></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Nó được viết bằng ngôn ngữ tự nhiên để người dùng dễ hiểu và lập trình viên dễ lập trình</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Nó hoạt động như trình biên dịch trung gian</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Nó được biểu diễn bằng mã nhị phân và hiểu trực tiếp bởi phần cứng máy tính&nbsp;</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Nó sử dụng các ký hiệu Latin và dễ ghi nhớ</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103470,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Mã máy được xem là ngôn ngữ lập trình cơ bản vì lý do nào sau đây?</span><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Trong giai đoạn đầu thập niên 1940 khi máy tính điện tử ra đời</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Khi máy tính cá nhân phổ biến vào đầu thập niên 1980</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Cuối thập niên 1960 khi phần mềm trở nên phức tạp hơn</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Đầu thập niên 2000 với sự xuất hiện của lập trình web</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103471,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Cuộc khủng hoảng phần mềm trong lịch sử phát triển công nghệ phần mềm bắt đầu vào khoảng thời gian nào?</span><o:p></o:p><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>C, với cú pháp đơn giản và mạnh mẽ do Kernighan và Ritchie phát triển</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Assembly, gần với mã máy</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>ALGOL W, một biến thể của ALGOL-60 do Wirth phát triển</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>BASIC, một ngôn ngữ dùng cho người mới học lập trình</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103473,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Ngôn ngữ lập trình Pascal được phát triển dựa trên nền tảng của ngôn ngữ nào dưới đây?</span></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Công nghệ phần mềm, với các phương pháp phát triển có tổ chức</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Công nghệ mạng và truyền thông, với hệ thống mạng internet phát triển</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Trí tuệ nhân tạo ứng dụng trong phần mềm</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Phần cứng máy tính cá nhân</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103479,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Cuộc khủng hoảng phần mềm đã dẫn đến sự ra đời và phát triển mạnh mẽ của lĩnh vực nào trong công nghệ thông tin?</span></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Giảm chi phí phần mềm đến mức tối thiểu</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Tối ưu hóa sự phối hợp giữa con người và máy tính&nbsp;</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Xây dựng phần mềm chỉ dùng một ngôn ngữ lập trình</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Loại bỏ hoàn toàn lỗi trong chương trình</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103482,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span>Mục tiêu cuối cùng của kỹ thuật lập trình và công nghệ phần mềm là gì?</span><o:p></o:p><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "5",
        value: "Khảo sát viên",
      },
      {
        id: "1",
        value: "Phân tích viên",
      },
      {
        id: "4",
        value: "Chuyên viên kiểm thử",
      },
      {
        id: "3",
        value: "Chuyên viên lập trình trưởng",
      },
      {
        id: "2",
        value: "Lập trình viên",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103483,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "<p><!--StartFragment--><span>Ghép giai đoạn quy trình sản xuất phần mềm với người thực hiện</span><!--EndFragment--></p>",
    question_number: 0,
    question_type: "drag_drop",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103483,
    id: 103484,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Giai đoạn 1-4 ",
    question_number: 0,
    question_type: "drag_drop",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103483,
    id: 103485,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Giai đoạn 5",
    question_number: 0,
    question_type: "drag_drop",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103483,
    id: 103486,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Giai đoạn 6",
    question_number: 0,
    question_type: "drag_drop",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103483,
    id: 103487,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Giai đoạn 7",
    question_number: 0,
    question_type: "drag_drop",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103517,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "<p><!--StartFragment--><span>Xác định các phát biểu <strong>đúng/sai</strong> liên quan đến quy trình công nghệ phần mềm và vai trò các chuyên viên:</span><!--EndFragment--></p>",
    question_number: 0,
    question_type: "group-radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value: "Đúng",
      },
      {
        id: "0",
        value: "Sai",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103517,
    id: 103518,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "Quy trình sản xuất phần mềm theo công nghệ thông thường bao gồm 9 giai đoạn rõ ràng, từ phân tích đến thu thập phản hồi",
    question_number: 0,
    question_type: "group-radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value: "Đúng",
      },
      {
        id: "0",
        value: "Sai",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103517,
    id: 103519,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "Giai đoạn 6 – chuyên gia lập trình trưởng – là người thực hiện kiểm thử phần mềm trước khi giao cho khách hàng",
    question_number: 0,
    question_type: "group-radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value: "Đúng",
      },
      {
        id: "0",
        value: "Sai",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103517,
    id: 103520,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "Việc phân tích yêu cầu và thiết kế phần mềm là trách nhiệm chính của các lập trình viên ngay từ đầu quy trình",
    question_number: 0,
    question_type: "group-radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value: "Đúng",
      },
      {
        id: "0",
        value: "Sai",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103517,
    id: 103521,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "Trong giai đoạn mã hóa, lập trình viên nên tận dụng các thuật toán hoặc thủ tục có sẵn để tăng hiệu quả phát triển",
    question_number: 0,
    question_type: "group-radio",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Các công cụ biên dịch và kiểm thử đã quá phức tạp, gây khó khăn trong sử dụng</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Thiếu các phương pháp phát triển phần mềm có hệ thống và quy trình chuẩn hóa</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Hệ điều hành không hỗ trợ đủ tính năng đa nhiệm khiến phần mềm dễ treo máy</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Độ phức tạp tăng cao do phần mềm ngày càng lớn trong khi kỹ thuật phát triển không theo kịp</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103525,
    media: null,
    number_answer_correct: 2,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span><strong>Trong các yếu tố sau, yếu tố nào là nguyên nhân trực tiếp dẫn đến cuộc khủng hoảng phần mềm vào cuối thập niên 1960?</strong> </span><i><span>(Chọn 2 đáp án đúng)</span></i><o:p></o:p><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "checkbox",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Thẻ đục lỗ với mỗi lỗ đại diện cho một ký tự mã hóa</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Máy đục thẻ (punch card machine) do Herman Hollerith phát minh</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Sử dụng trình soạn thảo văn bản như Notepad kết hợp hệ điều hành dòng lệnh</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Nhập lệnh bằng bàn phím cơ và lưu trữ trực tiếp qua ổ cứng SSD</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103528,
    media: null,
    number_answer_correct: 2,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span><strong>Công cụ và phương pháp nào được sử dụng phổ biến để nhập chương trình vào máy tính trong những năm 1950–1970?</strong> </span><i><span>(Chọn 2 đáp án đúng)</span></i><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "checkbox",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Tránh sử dụng cấu trúc điều khiển có điều kiện để đơn giản hóa mã nguồn</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>&nbsp;Ưu tiên lập trình bằng ngôn ngữ càng gần với mã máy càng tốt để tăng hiệu năng</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Tách bài toán lớn thành các phần nhỏ hơn có thể giải quyết độc lập</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Chú trọng đến tính đúng đắn, dễ hiểu và dễ bảo trì của chương trình&nbsp;</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103530,
    media: null,
    number_answer_correct: 2,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span><strong>Những tư tưởng lập trình nào dưới đây phản ánh đúng tinh thần cách mạng xuất hiện sau cuộc khủng hoảng phần mềm?</strong> </span><i><span>(Chọn 2 đáp án đúng)</span></i><o:p></o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "checkbox",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [
      {
        id: "1",
        value:
          "<p><!--StartFragment--><span>Thiết kế hệ thống hoàn toàn do một lập trình viên kỳ cựu thực hiện</span><!--EndFragment--></p>",
      },
      {
        id: "2",
        value:
          "<p><!--StartFragment--><span>Phân chia chức năng phần mềm thành các module tương đối độc lập</span><!--EndFragment--></p>",
      },
      {
        id: "3",
        value:
          "<p><!--StartFragment--><span>Tổ chức hợp tác nhóm giữa các vai trò khác nhau như lập trình viên, kiểm thử viên, và phân tích viên</span><!--EndFragment--></p>",
      },
      {
        id: "4",
        value:
          "<p><!--StartFragment--><span>Chỉ kiểm thử phần mềm sau khi triển khai để tiết kiệm thời gian phát triển</span><!--EndFragment--></p>",
      },
    ],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103531,
    media: null,
    number_answer_correct: 2,
    part: 0,
    question_direction:
      '<!--StartFragment--><p class="MsoNormal" align="left"><span><strong>Theo quy trình phát triển phần mềm hiện đại được hình thành sau khủng hoảng, hai yếu tố nào sau đây là then chốt để đảm bảo chất lượng sản phẩm?</strong> </span><i><span>(Chọn 2 đáp án đúng)</span></i><o:p></o:p><o:p></o:p></p><p class="MsoNormal" align="left"><o:p>&nbsp;</o:p></p><!--EndFragment-->',
    question_number: 0,
    question_type: "checkbox",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103538,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "<p><!--StartFragment--><span>Trong thời kỳ đầu của <!--StartFragment-->__(1)____<!--EndFragment--> , <!--StartFragment-->___<!--StartFragment-->(2)<!--EndFragment-->___<!--EndFragment--> thường viết mã bằng tay trên <!--StartFragment-->___(3)___<!--EndFragment--> , sau đó nhập vào máy thông qua ___(4)___ hoặc công tắc.</span><!--EndFragment--></p>",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103538,
    id: 103539,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền từ còn thiếu vào chỗ trống (1)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103538,
    id: 103540,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền từ còn thiếu vào chỗ trống (2)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103538,
    id: 103541,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền từ còn thiếu vào chỗ trống (3)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103538,
    id: 103542,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền từ còn thiếu vào chỗ trống (4)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 2,
      invertedAnswer: true,
    },
    group_id: 0,
    id: 103544,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction:
      "<p><!--StartFragment--><span>Một trong những&nbsp;<!--StartFragment--> ___(1)___<!--EndFragment--> chính dẫn đến cuộc khủng hoảng &nbsp;<!--StartFragment--> ___(2)___<!--EndFragment--> là do sản xuất phần mềm mang tính ___(3)___ và thiếu tính &nbsp;<!--StartFragment-->___(4)___<!--EndFragment-->.</span><!--EndFragment--></p>",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103544,
    id: 103545,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền tử còn thiếu vào ô trống (1)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103544,
    id: 103546,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền tử còn thiếu vào ô trống (2)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103544,
    id: 103547,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền tử còn thiếu vào ô trống (3)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
  {
    answer_option: [],
    cdr: 2,
    code: "",
    config: {
      cols: 1,
      invertedAnswer: true,
    },
    group_id: 103544,
    id: 103548,
    media: null,
    number_answer_correct: 1,
    part: 0,
    question_direction: "Điền tử còn thiếu vào ô trống (4)",
    question_number: 0,
    question_type: "group-input",
    shuff: null,
    skill: null,
  },
];
