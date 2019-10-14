<template lang="pug">
.h-100.w-100
  .navbar
    span Press F to enter fullscreen
    .ml-auto
      b-button.mr-3(variant="light" v-b-modal.open) Open
      b-button.mr-3(variant="light" :disabled="!raw" v-b-modal.edit-css) Edit CSS
      b-button.mr-3(variant="light" :disabled="!raw" @click="saveMarkdown") Save as Markdown
      b-button.mr-3(variant="light" :disabled="!raw" @click="exportZip") Export as ZIP
      b-link(href="https://github.com/reveal-editor")
        img(src="./assets/github.svg")
  .editor(:class="showPreview ? 'w-50' : 'w-100'")
    codemirror.codemirror(ref="cm" v-model="raw" :options="cmOptions" @input="onCmCodeChange")
  iframe#iframe(ref="iframe" v-show="showPreview" src="reveal.html" frameborder="0")
  b-modal#open(title="Open file or URL" :ok-disabled="!(openFile.file || openFile.url)" @ok="onOpenClicked")
    b-form-radio-group.mb-3(v-model="openFile.type", :options="openFile.options" buttons)
    b-form-file(v-model="openFile.file" v-if="openFile.type === 'file'")
    b-form-input(v-model="openFile.url" v-if="openFile.type === 'url'" placeholder="Type in the URL here." type="url")
  b-modal#edit-css(scrollable @show="tempCss = css" @ok="css = tempCss" title="CSS Editor")
    codemirror(v-model="tempCss" :options="{mode: 'css'}")
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import matter from "gray-matter";
import { RevealMaker } from '../../reveal-packager/src/reveal';
import FileSaver from "file-saver";
import JSZip from "jszip";
import sanitize from "sanitize-filename";

@Component
export default class App extends Vue {
  cmOptions = {
    mode: {
      name: "yaml-frontmatter",
      base: "markdown"
    }
  }
  raw = process.env.VUE_APP_PLACEHOLDER || "";
  css = "";
  tempCss = "";
  markdown = "";
  line: number = 0;
  offset: number = 0;
  showPreview = true;
  headers: any = {};
  openFile = {
    type: "file",
    options: [
      {text: "Local file", value: "file"},
      {text: "URL", value: "url"}
    ],
    file: null as File | null,
    url: ""
  };

  get codemirror(): CodeMirror.Editor {
    return (this.$refs.cm as any).codemirror;
  }

  get iframe(): HTMLIFrameElement {
    return this.$refs.iframe as HTMLIFrameElement;
  }

  get iframeWindow() {
    return this.iframe.contentWindow as Window & {
      Reveal: RevealStatic,
      reveal: RevealMaker;
    }
  }

  onIFrameReady(fn: () => void) {
    const toLoad = () => {
      this.iframeWindow.reveal.onReady(() => {
        fn();
      });
    };

    if (this.iframe && this.iframe.contentDocument) {
      if (this.iframeWindow.reveal) {
        toLoad();
      } else {
        this.iframeWindow.onload = toLoad;
      }
    }
  }

  mounted() {
    this.codemirror.addKeyMap({
      "Cmd-P": () => {this.showPreview = !this.showPreview},
      "Ctrl-P": () => {this.showPreview = !this.showPreview},
      "Cmd-S": () => {},
      "Ctrl-S": () => {}
    });
    this.codemirror.on("cursorActivity", (instance) => {
      this.line = instance.getCursor().line - this.offset;
    });
    this.codemirror.on("change", (instance) => {
      this.line = instance.getCursor().line - this.offset;
    });
    this.onCmCodeChange();
  }

  onCmCodeChange() {
    try {
      const m = matter(this.raw);
      Vue.set(this, "headers", m.data);
      this.markdown = m.content;
      this.offset = this.raw.replace(m.content, "").split("\n").length - 1;
    } catch(e) {
      this.markdown = this.raw;
      this.offset = 0;
    }

    this.onIFrameReady(() => {
      this.iframeWindow.reveal.update(this.raw);
    });
  }

  @Watch("line")
  onCursorMove() {
    let slideNumber = 0;
    let stepNumber = 0;
    let i = 0;
    for (const row of this.markdown.split("\n")) {
      if (/^(?:---|===)$/.test(row)) {
        slideNumber++;
        stepNumber = 0;
      } else if (/^--$/.test(row)) {
        stepNumber++;
      }
      i++;
      if (i >= this.line) {
        break;
      }
    }

    this.iframeWindow.Reveal.slide(slideNumber, stepNumber);
  }

  saveMarkdown() {
    FileSaver.saveAs(
      new Blob([this.raw], {type: "text/plain;charset=utf-8"}),
      `${sanitize(this.headers.title || "reveal")}.md`
    );
  }

  async exportZip() {
    const zip = new JSZip();

    const folder = zip.folder("reveal");
    await Promise.all([
      fetch("reveal.html").then((r) => r.text()).then((r) => zip.file("reveal.html", (() => {
        if (this.headers.offline) {
          r = r.replace('"reveal.min.js"', '"https://patarapolw.github.io/reveal-editor/reveal.min.js"');
        }

        return r.replace(
          "/** data */",
          `var data = ${JSON.stringify(this.raw).replace(/([<>])/g, '\\$1')}`
        ).replace(
          "/** css */",
          this.css
        )
      })())),
      ...(this.headers.offline ? [fetch("reveal.min.js").then((r) => r.text()).then((r) => zip.file("reveal.min.js", r))] : []),
      ...(this.headers.offline ? [...this.iframeWindow.reveal.rSource.css, ...this.iframeWindow.reveal.rSource.js] : [])
      .map((el) => {
        if (typeof el !== "string") {
          el = el.src;
        }

        return fetch(this.iframeWindow.revealCDN + el)
        .then((r) => r.blob()).then((r) => zip.file(el as string, r));
      })
    ]);

    zip.generateAsync({type: "blob"})
    .then((content) => {
        FileSaver.saveAs(content, `${sanitize(this.headers.title || "reveal")}.zip`);
    });
  }

  async onOpenClicked() {
    if (this.openFile.type === "url") {
      this.raw = await ((await fetch(this.openFile.url)).text());
    } else if (this.openFile.file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.raw = reader.result as string;
      }
      reader.readAsText(this.openFile.file);
    }
  }
}
</script>

<style lang="scss">
$navbar-height: 60px;

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

.h-100 {
  height: 100%;
}

.w-100 {
  width: 100%;
}

.w-50 {
  width: 50%;
}

.navbar {
  height: $navbar-height;
  width: 100%;
  background-color: orange;
}

#iframe {
  position: fixed;
  width: 48vw;
  height: calc(98vh - 60px);
  top: $navbar-height;
  left: 51vw;
}

.editor {
  height: calc(98vh - 60px) !important;

  .CodeMirror {
    height: calc(98vh - 60px) !important;
  }
}

#edit-css {
  .CodeMirror {
    min-height: 400px; 
  }
}

.CodeMirror {
  height: auto !important;
  widows: 100%;
}
</style>