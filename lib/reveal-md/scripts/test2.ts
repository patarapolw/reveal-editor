import scrape from "website-scraper";
// @ts-ignore
import SaveToExistingDirectoryPlugin from "website-scraper-existing-directory";

const cdn = "https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/";
[
  "css/reveal.css",
  "css/theme/white.css",
  "js/reveal.min.js",
  "plugin/highlight/highlight.js"
].forEach((el) => {
  const ps = el.split("/");
  scrape({
    urls: [cdn + el],
    directory: "output/" + ps.slice(0, ps.length - 1).join("/"),
    defaultFilename: ps[ps.length - 1],
    // @ts-ignore
    plugins: [ new SaveToExistingDirectoryPlugin() ]
  })
})