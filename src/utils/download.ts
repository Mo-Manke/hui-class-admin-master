// 文件用途：统一处理 Blob 下载

// 下载 Blob 文件
export const downloadBlob = (blob: Blob, filename: string) => {
  // 创建临时链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.click();
  window.URL.revokeObjectURL(url);
};
