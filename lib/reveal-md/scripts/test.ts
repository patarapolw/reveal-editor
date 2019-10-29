import RevealMd from "../src";
// @ts-ignore
import fs from "fs";

const r = new RevealMd();
r.update(fs.readFileSync("../../example.md", "utf8"));
r.export("output");
