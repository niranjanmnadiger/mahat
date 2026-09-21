import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the browser calls /api/* on the Vite server, and Vite forwards it to
// the Express API with the /api prefix stripped. Same origin, so no CORS needed.
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
