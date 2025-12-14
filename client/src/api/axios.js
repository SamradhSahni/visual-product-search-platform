// client/src/api/axios.js (example)
import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:5000/api", withCredentials: true });

// Example interceptor: only set JSON content-type for non-FormData
// client/src/api/axios.js (interceptor snippet)
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // leave Content-Type for browser/axios so boundary is included
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});


export default api;
