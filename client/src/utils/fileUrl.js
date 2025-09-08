import.meta.env;

const fileBaseURL = import.meta.env.VITE_FILE_BASE_URL?.replace(/\/$/, "");

export const fileUrl = (type, name) => {
  if (!name || !fileBaseURL) return undefined;
  return `${fileBaseURL}/uploads/${type}/${name}`;
};
