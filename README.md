Live Reveal.js editor, with Markdown and [HyperPug](https://github.com/patarapolw/hyperpug). See <https://patarapolw.github.com/reveal-editor>

Clone this repository and customize to your needs, e.g.
- Showdown extensions (with [indented-filter](https://github.com/patarapolw/indented-filter))
- HyperPug extensions
- SPA-ify Reveal app (e.g. by mounting `document.getElementsByClassName('reveal')[0]`)

If you don't need the live editor, or want a different editor, you can see [/reveal-packager](/reveal-packager).

## Features

- Global scripting `<script></script>` and styling `<style></style>` is now supported in slides marked with

```markdown
// global
content (Pug or HTML or extended Markdown)
```

- The slides marked with `// global` or `// hidden` will be hidden.
- Implementing `<style scoped>` would also be nice, but I haven't done it yet.

## NPM package for your Node application

See [/lib/reveal-md](/lib/reveal-md).
