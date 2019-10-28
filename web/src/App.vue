<template lang="pug">
.h-100.w-100
  .navbar
    span Press F to enter fullscreen
    .ml-auto
      b-button.mr-3(variant="light" v-b-modal.open) Open local file or URL
      b-button.mr-3(variant="light" :disabled="!raw" @click="saveMarkdown") Download Markdown
      b-link(href="https://github.com/patarapolw/reveal-editor")
        img(src="./assets/github.svg")
  .editor(:class="showPreview ? 'w-50' : 'w-100'")
    codemirror.codemirror(ref="cm" v-model="raw" :options="cmOptions" @input="onCmCodeChange")
  iframe#iframe(ref="iframe" v-show="showPreview" src="reveal.html" frameborder="0")
  b-modal#open(title="Open local file or URL" :ok-disabled="!(openFile.file || openFile.url)" @ok="onOpenClicked")
    b-form-radio-group.mb-3(v-model="openFile.type", :options="openFile.options" buttons)
    b-form-file(v-model="openFile.file" v-if="openFile.type === 'file'")
    b-form-input(v-model="openFile.url" v-if="openFile.type === 'url'" placeholder="Type in the URL here." type="url")
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import matter from "gray-matter";
import RevealMd from "@patarapolw/reveal-md";
import FileSaver from "file-saver";
import sanitize from "sanitize-filename";
import { RevealStatic } from "reveal.js";

@Component
export default class App extends Vue {
  cmOptions = {
    mode: {
      name: "yaml-frontmatter",
      base: "markdown"
    }
  }
  raw = process.env.VUE_APP_PLACEHOLDER || "";
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
      revealMd: RevealMd;
    }
  }

  onIFrameReady(fn: () => void) {
    const toLoad = () => {
      this.iframeWindow.revealMd.onReady(() => {
        fn();
      });
    };

    if (this.iframe && this.iframe.contentDocument) {
      if (this.iframeWindow.revealMd) {
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

    this.openFile.url = new URL(location.href).searchParams.get("q") || "";
    if (this.openFile.url) {
      this.openFile.type === "url";
      this.onOpenClicked();
    } else {
      this.onCmCodeChange();
    }
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
      this.iframeWindow.revealMd.update(this.raw);
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
      } else if (/^--$/g.test(row)) {
        stepNumber++;
      } else if (row === "// global" || row === "// hidden") {
        slideNumber--;
      }
      i++;
      if (i > this.line) {
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

  async onOpenClicked() {
    if (this.openFile.type === "url") {
      const url = new URL(location.href);
      url.searchParams.set("q", this.openFile.url);
      history.pushState(null, "", url.href);
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

.CodeMirror {
  height: auto !important;
  widows: 100%;
}
</style>