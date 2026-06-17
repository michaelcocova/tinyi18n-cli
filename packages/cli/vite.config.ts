import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    clean: false,
    dts: {
      tsgo: false,
    },
    exports: true,
  },
  run: {
    tasks: {
      build: {
        command: "vp pack",
        dependsOn: ["@tinyi18n/studio#build"],
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
