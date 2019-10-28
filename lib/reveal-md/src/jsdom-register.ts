export const isNode = (typeof module !== "undefined" && module.exports);

if (isNode) {
  require("jsdom-global")();
}