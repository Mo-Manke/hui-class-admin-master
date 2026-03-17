export function calculateTime(valueInSeconds) {
  // 定义时间单位的秒数
  const secondsInYear = 365 * 24 * 60 * 60; // 一年（不考虑闰年）
  const secondsInMonth = 30 * 24 * 60 * 60; // 一个月（平均）
  const secondsInDay = 24 * 60 * 60; // 一天
  const secondsInHour = 60 * 60; // 一小时
  const secondsInMinute = 60; // 一分钟

  let years = Math.floor(valueInSeconds / secondsInYear);
  valueInSeconds %= secondsInYear;

  let months = Math.floor(valueInSeconds / secondsInMonth);
  valueInSeconds %= secondsInMonth;

  let days = Math.floor(valueInSeconds / secondsInDay);
  valueInSeconds %= secondsInDay;

  let hours = Math.floor(valueInSeconds / secondsInHour);
  valueInSeconds %= secondsInHour;

  let minutes = Math.floor(valueInSeconds / secondsInMinute);
  let seconds = valueInSeconds % secondsInMinute;

  // 构建结果字符串
  const timeUnits = [];
  if (years > 0) timeUnits.push(`${years}年`);
  if (months > 0) timeUnits.push(`${months}月`);
  if (days > 0) timeUnits.push(`${days}日`);
  if (hours > 0) timeUnits.push(`${hours}时`);
  if (minutes > 0) timeUnits.push(`${minutes}分`);
  if (seconds > 0) timeUnits.push(`${seconds}秒`);

  // 如果没有任何单位，则返回 "0秒"
  return timeUnits.length > 0 ? timeUnits.join(" ") : "0秒";
}

//获取当前时间戳/秒
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}
