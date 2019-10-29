import "./reveal-d";
import { RevealStatic } from "reveal.js";
import hljs from "highlight.js";
import pug, { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
import h from "hyperscript"
import matter from "gray-matter";
import { isNode } from "./jsdom-register";
import $ from "cash-dom";

declare global {
  interface Window {
    Reveal: RevealStatic;
    revealMd: RevealMd;
  }
}

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

    if (isNode) {
      $("head").append("<meta charset='utf-8'>");
      $("body").append(h("div", [
        h("#global", {
          style: "display: none"
        }),
        h(".reveal", [
          h(".slides")
        ])
      ]).innerHTML);
    }

    window.revealMd = this;
    const $body = $("body");

    for (const href of this.revealOptions.css) {
      $body.append($("<link>").attr({
        class: "reveal-css",
        href: this.revealOptions.cdn + href,
        rel: "stylesheet",
        type: "text/css"
      }));
    }

    $body.append($("<link>").attr({
      id: "reveal-theme",
      class: "reveal-css",
      href: this.revealOptions.cdn + "css/theme/white.css",
      rel: "stylesheet",
      type: "text/css"
    }));

    for (let js of this.revealOptions.js) {
      if (typeof js === "string") {
        $body.append($("<script>").attr({
          class: "reveal-js",
          type: "text/javascript",
          src: this.revealOptions.cdn + js
        }));
      } else {
        const { async, src } = js;
        $body.append($("<script>").attr({
          class: "reveal-js",
          async,
          type: "text/javascript",
          src: this.revealOptions.cdn + src
        }));
      }
    }

    if (isNode) {
      $body.append($("<script>").attr({
        class: "reveal-js",
        async: true,
        type: "text/javascript",
        src: this.revealOptions.cdn + "plugin/highlight/highlight.js"
      }));

      $body.append($("<script>/** inline-js */</script>"));
    } else {
      window.addEventListener("load", () => {
        const reveal = window.Reveal;

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
    }
  }

  get headers(): any {
    return this._headers;
  }

  set headers(h: any) {
    this.onReady((reveal) => {
      if (h.theme) {
        $("#reveal-theme").attr("href", this.revealOptions.cdn + `css/theme/${h.theme}.css`);
      }
  
      $("link.reveal-css").each((_: number, el: any) => {
        const link = el as HTMLLinkElement;
        if (!link.href.startsWith(this.revealOptions.cdn)) {
          link.href = this.revealOptions.cdn + link.href;
        }
      });
  
      $("script.reveal-js").each((_: number, el: any) => {
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

  update(markdown: string) {
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
              $("#global").html(sectionRaw.content);
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
            const container = $("<div class='container'>");
            container.html(thisRaw.content);

            let subSection = this.getSlide(x, y);
            let section = this.getSlide(x);

            if (section && subSection) {
              const oldContainers = $(".container", $(subSection));
              oldContainers.remove();
              $(subSection).append(container);
            } else {
              const ss = $("<section>");
              ss.append(container);

              if (section) {
                $(section).append(ss);
              } else {
                const s = $("<section>");
                s.append(ss);
                $(".reveal .slides").append(s);
              }
            }

            $("pre code", container).each((_: number, el: any) => {
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
              $(subSection).remove();
            }
          }
        });

        if (!newRaw[x]) {
          const section = this.getSlide(x);
          if (section) {
            $(section).remove();
          }
        }
      });

      this.raw = newRaw;
    };

    setBody();
    this.setTitle(this.headers.title);
  }

  onReady(fn: (reveal?: RevealStatic) => void) {
    const reveal = window.Reveal;
    if (reveal && reveal.isReady()) {
      fn(reveal);
      // reveal.slide(-1, -1, -1);
      // reveal.sync();
    } else {
      this.queue.ready.push((fn));
    }
  }

  once(type: string, listener: () => void) {
    const reveal = window.Reveal;
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
    const $title = $("title");
    if ($title.length === 0) {
      const title = $("<title>");
      title.text(s || "");
      $("head").append(title);
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
    const s = $(".slides > section");
    const hSlide = s[x];

    if (typeof y === "number") {
      if (hSlide) {
        const vSlides = $(hSlide).children("section");

        return vSlides[y];
      }

      return undefined;
    }

    return hSlide;
  }

  /**
   * 
   * @param dst Destination directory, in case of Node.js
   */
  async export(dst?: string): Promise<string> {
    let html: string | null = null;

    if (this.headers.offline) {
      const headers = this.headers;

      if (isNode && dst) {
        const scrape = (await import("website-scraper")).default;
        const SaveToExistingDirectoryPlugin = require('website-scraper-existing-directory');

        const cdn = this.revealOptions.cdn;

        class CDNPlugin {
          constructor(private cdn: string) {}
        
          apply(registerAction: any) {
            registerAction("generateFilename", ({resource}: {resource: any}) => {
              return {filename: resource.url.replace(this.cdn, "")};
            })
          }
        }
        
        scrape({
          urls: [
            cdn + "css/reveal.css",
            cdn + `css/theme/${this.headers.theme || "white"}.css`,
            cdn + "js/reveal.min.js",
            // cdn + "plugin/highlight/highlight.js",
          ],
          directory: dst,
          // @ts-ignore
          plugins: [new SaveToExistingDirectoryPlugin(), new CDNPlugin(cdn)]
        });

        // html = document.documentElement.outerHTML.replace("/** inline-js */", `
        // window.onload = () => Reveal.initialize({
        //   dependencies: [
        //     { src: 'plugin/highlight/highlight.js', async: true },
        //   ]
        // })
        // `);
      } else {
        headers.offline = false;
        this.headers = headers;
      }
    }

    if (html === null) {
      html = document.documentElement.outerHTML.replace("/** inline-js */", `
      window.onload = () => Reveal.initialize()
      `);
    }

    if (isNode && dst) {
      const { writeFileSync } = await import("fs");
      const { join } = await import("path");
      const mkdirp = require("mkdirp");
      mkdirp.sync(dst);
      writeFileSync(join(dst, "index.html"), html);
    }

    return html;
  }
}

export default RevealMd;
