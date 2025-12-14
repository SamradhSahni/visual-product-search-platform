// client/src/api/search.js
import api from "./axios";

export const searchByImage = async (file, k = 12) => {
  const form = new FormData();
  form.append("image", file, file.name || "query.jpg");

  // IMPORTANT: do NOT set Content-Type manually.
  return api.post(`/search/image?k=${k}`, form);
};
