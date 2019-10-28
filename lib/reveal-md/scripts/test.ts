import RevealMd from "../src";
import fs from "fs";

(async () => {
  const r = new RevealMd();
  await r.update(fs.readFileSync("../../example.md", "utf8"));
  await r.export("output");
})();
