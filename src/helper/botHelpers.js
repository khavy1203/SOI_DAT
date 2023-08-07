function isNumberString(str) {
  // Sử dụng biểu thức chính quy để kiểm tra chuỗi
  // ^\d+$: Bắt đầu (^) và kết thúc ($) với một hoặc nhiều số (\d+)
  return /^\d+$/.test(str) || !str;
}

async function sleep(number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, number * 1000);
  });
}

function checkValueType(value) {
  if (!isNaN(value)) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  isNumberString,
  sleep,
  checkValueType
};
