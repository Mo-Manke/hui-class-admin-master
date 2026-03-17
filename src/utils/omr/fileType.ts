export const isImageFileType = (fileType?: string | null) => {
  const value = String(fileType || "").trim().toLowerCase();
  if (!value) return false;
  return value === "image";
};

export const normalizeFileNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? "").trim()).filter(Boolean);
  }
  if (value === null || value === undefined) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item ?? "").trim()).filter(Boolean);
      }
    } catch {
      // ignore
    }
  }
  return text
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

export const formatFileNamesText = (fileNames?: string[] | null) => {
  return (fileNames || []).filter(Boolean).join(", ");
};
