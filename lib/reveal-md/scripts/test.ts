import RevealMd from "../src";
// @ts-ignore
import fs from "fs";

const r = new RevealMd();
r.update(fs.readFileSync("../../example.md", "utf8"));
fs.writeFileSync("output/index.html", r.export());
