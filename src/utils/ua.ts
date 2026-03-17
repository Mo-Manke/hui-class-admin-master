// 文件用途：解析 UA 字符串，返回基础浏览器/系统/设备信息

export interface UaParseResult {
  // 浏览器信息
  browser: string;
  // 系统信息
  os: string;
  // 设备信息
  device: string;
}

// 解析 UA 字符串
export const parseUserAgent = (ua: string | null | undefined): UaParseResult => {
  // UA 原始字符串
  const raw = (ua || "").trim();
  if (!raw) {
    return { browser: "-", os: "-", device: "-" };
  }

  // 浏览器识别
  let browser = "Unknown";
  if (/Edg\//i.test(raw)) browser = "Edge";
  else if (/OPR\//i.test(raw)) browser = "Opera";
  else if (/Chrome\//i.test(raw)) browser = "Chrome";
  else if (/Firefox\//i.test(raw)) browser = "Firefox";
  else if (/Safari\//i.test(raw) && !/Chrome\//i.test(raw)) browser = "Safari";
  else if (/MSIE|Trident/i.test(raw)) browser = "IE";

  // 系统识别
  let os = "Unknown";
  if (/Windows NT/i.test(raw)) os = "Windows";
  else if (/Mac OS X/i.test(raw) && !/iPhone|iPad/i.test(raw)) os = "macOS";
  else if (/Android/i.test(raw)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(raw)) os = "iOS";
  else if (/Linux/i.test(raw)) os = "Linux";

  // 设备识别
  let device = "Desktop";
  if (/iPad|Tablet/i.test(raw)) device = "Tablet";
  else if (/Mobi|Android|iPhone|iPod/i.test(raw)) device = "Mobile";

  return { browser, os, device };
};
