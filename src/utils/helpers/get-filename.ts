export const cleanFileName = (filename = "") => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const cleaned = nameWithoutExt.replace(/^[a-f0-9]+_/i, "");
  return cleaned;
};
