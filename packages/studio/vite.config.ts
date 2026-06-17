import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";

function copyStudioToCli() {
  const webOutputRoot = path.resolve(__dirname, ".output");
  const webServerOutputRoot = path.resolve(webOutputRoot, "server");
  const cliDistRoot = path.resolve(__dirname, "../cli/dist");
  const publicTargetRoot = path.resolve(cliDistRoot, "public");
  const serverTargetRoot = path.resolve(cliDistRoot, "server");
  const legacyUiTargetRoot = path.resolve(cliDistRoot, "ui");
  const legacyStudioTargetRoot = path.resolve(cliDistRoot, "studio");

  return {
    name: "copy-studio-to-cli",
    apply: "build" as const,
    async writeBundle(options: { dir?: string }) {
      if (!options.dir) {
        return;
      }

      const bundleDir = path.resolve(options.dir);

      // Nitro writes client and server outputs separately. Copy only after the
      // server bundle is written so the packaged studio stays complete.
      if (bundleDir !== webServerOutputRoot) {
        return;
      }

      await rm(publicTargetRoot, { recursive: true, force: true });
      await rm(serverTargetRoot, { recursive: true, force: true });
      await rm(legacyUiTargetRoot, { recursive: true, force: true });
      await rm(legacyStudioTargetRoot, { recursive: true, force: true });
      await mkdir(cliDistRoot, { recursive: true });
      await cp(path.resolve(webOutputRoot, "public"), publicTargetRoot, { recursive: true });
      await cp(path.resolve(webOutputRoot, "server"), serverTargetRoot, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [
    copyStudioToCli(),
    nitro(),
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ["vue", "vue-router", "pinia", "vee-validate"],
      dts: "./typings/auto-imports.d.ts",
      dirs: [
        path.resolve(__dirname, "./src/composables"),
        path.resolve(__dirname, "./src/utils"),
        path.resolve(__dirname, "./src/constants"),
      ],
      vueTemplate: true,
      dtsMode: "overwrite",
    }),
    Components({
      dirs: [path.resolve(__dirname, "./src/components")],
      dts: "./typings/components.d.ts",
      dtsTsx: true,
      dumpComponentsInfo: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
