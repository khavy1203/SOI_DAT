function isNumberString(str) {
  // Sử dụng biểu thức chính quy để kiểm tra chuỗi
  // ^\d+$: Bắt đầu (^) và kết thúc ($) với một hoặc nhiều số (\d+)
  return /^\d+$/.test(str) || !str;
}

async function sleep(number) {
  return await new Promise(async(resolve) => {
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

function checkOutTime(startTime){
  return performance.now()-startTime >80000;
}

module.exports = {
  isNumberString,
  sleep,
  checkValueType,
  checkOutTime
};
