import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    preserveSymlinks: false
  },
  server: {
    fs: {
      strict: false
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  optimizeDeps: {
    include: ["papaparse", "recharts"]
  },
  plugins: [react()],
});
