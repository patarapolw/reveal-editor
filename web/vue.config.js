const fs = require("fs");

process.env.VUE_APP_PLACEHOLDER = fs.readFileSync("../example.md", "utf-8");

module.exports = {
  publicPath: "",
  // pages: {
  //   index: "src/main.ts",
  //   reveal: {
  //     entry: "../reveal-packager/src/reveal.ts",
  //     template: "../reveal-packager/src/reveal.html",
  //     filename: 'reveal.html',
  //   }
  // }
};