# @patarapolw/reveal-md

A framework for manipulating Reveal.js <--> Markdown. With Showdown extensions and [HyperPug](https://github.com/patarapolw/hyperpug). See <https://patarapolw.github.com/reveal-editor>

## Features

- Global scripting `<script></script>` and styling `<style></style>` is now supported in slides marked with

```markdown
// global
content (Pug or HTML or extended Markdown)
```

- The slides marked with `// global` or `// hidden` will be hidden.
- Implementing `<style scoped>` would also be nice, but I haven't done it yet.
- Showdown extensions (with [indented-filter](https://github.com/patarapolw/indented-filter))
- HyperPug extensions

## Exporting to single file HTML

I have already tested this in [/scripts/test.ts](/scripts/test.ts)

```typescript
import RevealMd from "@patarapolw/reveal-md";
import fs from "fs";

const r = new RevealMd();
r.update(fs.readFileSync("../../example.md", "utf8"));
r.export("output");
```

## Live editor

See <https://github.com/patarapolw/reveal-editor>.

## Installation

```
npm i @patarapolw/reveal-md
```
