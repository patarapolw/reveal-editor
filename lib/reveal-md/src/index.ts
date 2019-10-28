import "./reveal-d";
import { RevealStatic } from "reveal.js";
import hljs from "highlight.js";
import pug, { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
import h from "hyperscript"
import matter from "gray-matter";
import { Cash, CashStatic, Selector } from "cash-dom";
import { JSDOM } from "jsdom";

let $: (((selector?: Selector, context?: Element | HTMLElement | Document | Cash) => Cash) & CashStatic) | null = null;

export const options: IRevealOptions = {
  cdn: "https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/",
  css: [
    "css/reveal.css"
  ],
  js: [
    "js/reveal.min.js"
  ]
}

export interface ISlide {
  lang?: string;
  comment?: string;
  content: string;
  raw: string;
}

export interface IRevealOptions {
  cdn: string;
  css: string[];
  js: (string | { async: boolean, src: string })[];
}

export class RevealMd {
  raw: ISlide[][] = [[]];
  queue: {
    ready: Array<(reveal?: RevealStatic) => void>
  } = {
    ready: []
  };

  mdConverter: showdown.Converter;
  pugConverter: (s: string) => string;

  revealOptions: IRevealOptions;

  private _headers: any = {};
  private _dom: JSDOM | null = null;

  constructor(public revealMdOptions: {
    markdown?: showdown.ShowdownExtension[];
    pug?: IHyperPugFilters;
  } = {}, revealOptions: Partial<IRevealOptions> = {}) {
    this.revealOptions = JSON.parse(JSON.stringify(options));

    this.revealOptions.cdn = revealOptions.cdn || this.revealOptions.cdn;
    if (revealOptions.css) {
      this.revealOptions.css.push(...revealOptions.css);
    }
    if (revealOptions.js) {
      this.revealOptions.js.push(...revealOptions.js);
    }

    this.mdConverter = new showdown.Converter();
    this.mdConverter.setFlavor("github");
    if (revealMdOptions.markdown) {
      revealMdOptions.markdown.forEach((x) => this.mdConverter.addExtension(x));
    }

    const pugFilters = {
      markdown: (text: string) => {
        return this.mdConverter.makeHtml(text);
      },
      ...(revealMdOptions.pug || {})
    };

    this.pugConverter = pug.compile({ filters: pugFilters });

    this.init();
  }

  readonly isBrowser = (typeof window !== "undefined");

  get headers(): any {
    return this._headers;
  }

  set headers(h: any) {
    this.onReady((reveal) => {
      if (h.theme) {
        this.$("#reveal-theme").attr("href", this.revealOptions.cdn + `css/theme/${h.theme}.css`);
      }
  
      this.$("link.reveal-css").each((_: number, el: any) => {
        const link = el as HTMLLinkElement;
        if (!link.href.startsWith(this.revealOptions.cdn)) {
          link.href = this.revealOptions.cdn + link.href;
        }
      });
  
      this.$("script.reveal-js").each((_: number, el: any) => {
        const script = el as HTMLScriptElement;
        if (!script.src.startsWith(this.revealOptions.cdn)) {
          script.src = this.revealOptions.cdn + script.src;
        }
      });

      if (reveal) {
        reveal.configure(h);
      }
    });

    this._headers = h;
  }

  async init() {
    if (!this.isBrowser) {
      const { JSDOM } = await import("jsdom");

      this._dom = new JSDOM(h("html", [
        h("head", [
          h("meta", { charset: "utf-8" })
        ]),
        h("body", [
          h(".reveal", [
            h(".slides")
          ])
        ])
      ]).outerHTML);
      (global as any).window = this.window;
      (global as any).document = this.window.document;
    }

    this.window.revealMd = this;

    $ = (await import("cash-dom")).default;
    const $body = this.$("body");

    for (const href of this.revealOptions.css) {
      $body.append(this.$("<link>").attr({
        class: "reveal-css",
        className: "reveal-css",
        href: this.revealOptions.cdn + href,
        rel: "stylesheet",
        type: "text/css"
      }));
    }

    $body.append(this.$("<link>").attr({
      id: "reveal-theme",
      class: "reveal-css",
      className: "reveal-css",
      href: this.revealOptions.cdn + "css/theme/white.css",
      rel: "stylesheet",
      type: "text/css"
    }));

    for (let js of this.revealOptions.js) {
      if (typeof js === "string") {
        $body.append(this.$("<script>").attr({
          className: "reveal-js",
          type: "text/javascript",
          src: this.revealOptions.cdn + js
        }));
      } else {
        const { async, src } = js;
        $body.append(this.$("<script>").attr({
          className: "reveal-js",
          async,
          type: "text/javascript",
          src: this.revealOptions.cdn + src
        }));
      }
    }

    if (this.isBrowser) {
      this.window.addEventListener("load", () => {
        const reveal = this.window!.Reveal;

        if (reveal) {
          reveal.initialize();

          this.onReady(() => {
            if (this.queue.ready.length > 0) {
              this.queue.ready.forEach((it) => it(reveal));
              reveal.slide(-1, -1, -1);
              reveal.sync();
            }
          });
        }
      });
    } else {
      $body.append(this.$("<script>").attr({
        className: "reveal-js",
        async: true,
        type: "text/javascript",
        src: this.revealOptions.cdn + "plugin/highlight/highlight.js"
      }));

      $body.append(this.$("<script>/** inline-js */</script>"));

      if (this.queue.ready.length > 0) {
        this.queue.ready.forEach((it) => it());
      }
    }
  }

  get window(): Window & {
    Reveal?: RevealStatic;
    revealMd?: RevealMd;
  } {
    if (this.isBrowser) {
      return window;
    } else {
      return this._dom!.window;
    }
  }

  get reveal(): RevealStatic | undefined {
    return this.isBrowser ? this.window.Reveal : undefined;
  }

  $(selector: any, context?: any) {
    if (context) {
      return $!(selector, context);
    } else {
      return $!(selector);
    }
  }

  async update(markdown: string) {
    const { data, content } = matter(markdown);

    this.headers = data;

    const setBody = () => {
      let reverseOffset = 0;

      const newRaw = content.split(/\r?\n(?:---|===)\r?\n/g).map((el, x) => {
        const sectionRaw = this.parseSlide(el);
        if (sectionRaw.comment) {
          const lines = sectionRaw.comment.split("\n");
          if (lines.includes("hidden") || lines.includes("global")) {
            if (lines.includes("global")) {
              this.$("head").append(this.$("<div style='display: none;'>").append(sectionRaw.content));
            }

            reverseOffset++;
            return null;
          }
        }

        x -= reverseOffset;
        this.raw[x] = this.raw[x] || [];

        return el.split(/\r?\n--\r?\n/g).map((ss, y) => {
          const thisRaw = this.parseSlide(ss);

          if (!this.raw[x][y] || (this.raw[x][y] && this.raw[x][y].raw !== ss)) {
            const container = this.$("<div class='container'>");
            container.html(thisRaw.content);

            let subSection = this.getSlide(x, y);
            let section = this.getSlide(x);

            if (section && subSection) {
              const oldContainers = this.$(".container", this.$(subSection));
              oldContainers.remove();
              this.$(subSection).append(container);
            } else {
              const ss = this.$("<section>");
              ss.append(container);

              if (section) {
                this.$(section).append(ss);
              } else {
                const s = this.$("<section>");
                s.append(ss);
                this.$(".reveal .slides").append(s);
              }
            }

            this.$("pre code", container).each((_: number, el: any) => {
              hljs.highlightBlock(el);
            });
          }

          return thisRaw;
        });
      }).filter((el) => el !== null) as ISlide[][];

      this.raw.map((el, x) => {
        el.map((ss, j) => {
          const y = el.length - j - 1;

          if (!newRaw[x] || !newRaw[x][y]) {
            const subSection = this.getSlide(x, y);
            if (subSection) {
              this.$(subSection).remove();
            }
          }
        });

        if (!newRaw[x]) {
          const section = this.getSlide(x);
          if (section) {
            this.$(section).remove();
          }
        }
      });

      this.raw = newRaw;
    };

    return new Promise((resolve) => {
      this.onReady(() => {
        setBody();
        this.setTitle(this.headers.title);
        resolve();
      });
    })
  }

  onReady(fn: (reveal?: RevealStatic) => void) {
    const reveal = this.reveal;
    if (reveal && reveal.isReady()) {
      fn(reveal);
      // reveal.slide(-1, -1, -1);
      // reveal.sync();
    } else {
      this.queue.ready.push((fn));
    }
  }

  once(type: string, listener: () => void) {
    const reveal = this.reveal;
    if (reveal && reveal.isReady) {
      const removeOnDone = () => {
        listener();
        reveal.removeEventListener(type, removeOnDone);
      }

      reveal.addEventListener(type, removeOnDone);
    } else {
      this.queue.ready.push(listener);
    }
  }

  setTitle(s?: string) {
    const $title = this.$("title");
    if ($title.length === 0) {
      const title = this.$("<title>");
      title.text(s || "");
      this.$("head").append(title);
    } else {
      $title.text(s || "");
    }
  }

  parseSlide(text: string): ISlide {
    const raw = text;
    let lang = "";

    const commentLines: string[] = [];
    const contentLines: string[] = [];
    let isContent = true;

    for (const line of text.split("\n")) {
      isContent = true;

      if (contentLines.length === 0 && line.startsWith("// ")) {
        commentLines.push(line.substr(3));
        isContent = false;
      }

      if (lang && line.startsWith("```")) {
        break;
      }

      if (contentLines.length === 0 && line.startsWith("```")) {
        lang = line.substr(3);
        isContent = false;
      }

      if (isContent) {
        contentLines.push(line);
      }
    }

    lang = lang || "markdown";

    const comment = commentLines.join("\n");
    let html = contentLines.join("\n") || text;

    switch (lang) {
      case "markdown": html = this.mdConverter.makeHtml(html); break;
      case "html": break;
      case "pug": html = this.pugConverter(html); break;
      default:
        const pre = h("pre");
        pre.innerText = html;
        html = pre.outerHTML;
    }

    return { lang, comment, content: html, raw };
  }

  buildSlide(slide: ISlide): string {
    const resultArray: string[] = [];

    if (slide.comment) {
      for (const line of slide.comment.split("\n")) {
        resultArray.push(`// ${line}`);
      }
    }

    const commentStr = "```";

    if (slide.lang !== "markdown") {
      resultArray.push(`${commentStr}${slide.lang || "html"}`);
    }

    for (const line of slide.content.split("\n")) {
      resultArray.push(line);
    }

    if (slide.lang !== "markdown") {
      resultArray.push(commentStr);
    }

    return resultArray.join("\n");
  }

  getSlide(x: number, y?: number) {
    const s = this.$(".slides > section");
    const hSlide = s[x];

    if (typeof y === "number") {
      if (hSlide) {
        const vSlides = this.$(hSlide).children("section");

        return vSlides[y];
      }

      return undefined;
    }

    return hSlide;
  }

  /**
   * 
   * @param dst Folder name to store the export
   */
  async export(dst: string) {
    const fs = await import("fs-extra");
    const { normalize } = await import("path");

    if (this.headers.offline) {
      const headers = this.headers;
      headers.offline = false;
      this.headers = headers;

      // const scraper = (await import("website-scraper")).default;
      // const SaveToExistingDirectoryPlugin = require('website-scraper-existing-directory');

      // await scraper({
      //   urls: [`file://${dst}/index.html`],
      //   directory: dst,
      //   // @ts-ignore
      //   plugins: [ new SaveToExistingDirectoryPlugin() ]
      // });
    }

    fs.ensureFileSync(normalize(`${dst}/index.html`));
    fs.writeFileSync(normalize(`${dst}/index.html`), this.window.document.documentElement.outerHTML.replace("/** inline-js */", `
    window.onload = () => Reveal.initialize()
    `));
  }
}

export default RevealMd;
