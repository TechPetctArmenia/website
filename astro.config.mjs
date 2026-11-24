import { defineConfig } from "astro/config";

const isGhPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: isGhPages
    ? "https://techpetctarmenia.github.io"
    : "https://www.petct-armenia.am",
  base: isGhPages ? "/website" : "/",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  compressHTML: true,
});
