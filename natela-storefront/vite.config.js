import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["capstoneproj-309-group-4-storefront.onrender.com"],
  },
});
