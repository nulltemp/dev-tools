import { defineConfig } from "vite";

// next build (output: "export") の out/ を本番と同じ静的ファイルとして配信する
export default defineConfig({
  appType: "mpa",
  build: { outDir: "out" },
});
