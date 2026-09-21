import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Anything the browser requests at /api/... is forwarded to the backend on
// port 3000, with "/api" removed. So /api/customers becomes
// http://localhost:3000/customers. Both sides look like the same origin to
// the browser, so CORS never gets in the way during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
