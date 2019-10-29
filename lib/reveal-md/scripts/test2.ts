import scrape, { Resource } from "website-scraper";
// @ts-ignore
import SaveToExistingDirectoryPlugin from "website-scraper-existing-directory";

const cdn = "https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/";

class CDNPlugin {
  constructor(private cdn: string) {}

  apply(registerAction: any) {
    registerAction("generateFilename", ({resource}: {resource: Resource}) => {
      return {filename: resource.url.replace(this.cdn, "")};
    })
  }
}

scrape({
  urls: [
    cdn + "css/reveal.css",
    cdn + "css/theme/white.css",
    cdn + "js/reveal.min.js",
    cdn + "plugin/highlight/highlight.js",
  ],
  directory: "output",
  // @ts-ignore
  plugins: [new SaveToExistingDirectoryPlugin(), new CDNPlugin(cdn)]
});