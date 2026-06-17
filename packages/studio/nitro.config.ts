import { defineConfig } from "nitro";
import path from "node:path";

export default defineConfig({
  serverDir: "./server",
  traceDeps: ["jiti*"],
  builder: "vite",
  alias: {
    "@tinyi18n/cli": path.resolve(__dirname, "../cli"),
  },
});
