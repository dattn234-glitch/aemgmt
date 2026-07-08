import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3000"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("radix-ui") || id.includes("react-day-picker") || id.includes("date-fns") || id.includes("/motion") || id.includes("framer-motion") || id.includes("lucide-react")) {
            return "ui";
          }

          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "react";
          }

          return undefined;
        }
      }
    }
  }
});
