import hljs from "highlight.js";
import pug from "hyperpug";
import showdown from "showdown";
import h from "hyperscript"
import matter from "gray-matter";
import "./reveal.scss";

declare global {
  interface Window {
    Reveal: RevealStatic;
    reveal: RevealMaker;
    revealCDN: string;
    data: string;
  }
}

window.revealCDN = "https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/";

let mainDiv: HTMLDivElement;

window.addEventListener("load", async () => {
  mainDiv = document.getElementById("slides") as HTMLDivElement;
  const Reveal = window.Reveal;

  Reveal.initialize();

  Reveal.once = (type, listener, useCapture) => {
    const removeOnDone = () => {
      listener(undefined);
      Reveal.removeEventListener(type, removeOnDone, useCapture);
    }
  
    if (Reveal.isReady()) {
      Reveal.addEventListener(type, removeOnDone, useCapture);
    } else {
      setTimeout(() => {
        Reveal.once(type, listener, useCapture);
      }, 100);
    }
  }
  
  Reveal.onReady = (listener) => {
    if (Reveal.isReady()) {
      listener();
    } else {
      Reveal.once("ready", listener);
    }
  }

  Reveal.once("ready", () => {
    window.reveal.reveal = window.Reveal;
    window.reveal.queue.forEach((it) => it());
    window.reveal.queue = [];
    Reveal.slide(-1, -1, -1);
    Reveal.sync();
  });
});

const mdConverter = new showdown.Converter();
mdConverter.setFlavor("github");
const pugFilters = {
  markdown: (text: string) => {
    return mdConverter.makeHtml(text);
  }
};

function renderDOM(text: string) {
  let lang = "markdown";
  const m = /(?:^|\r?\n)```(\S+)\r?\n(.+)```(?:\r?\n|$)/ms.exec(text);
  if (m) {
    lang = m[1];
    text = m[2];
  }

  let html = text;

  switch(lang) {
    case "markdown": html = mdConverter.makeHtml(text); break;
    case "html": html = text; break;
    case "pug": html = pug.compile({filters: pugFilters})(text); break;
    default:
      const pre = document.createElement("pre");
      pre.innerText = text;
      html = pre.outerHTML;
  }

  return html;
}

export class RevealMaker {
  raw: string[][] = [[]];
  headers: any = {};
  queue: Array<() => void> = [];
  reveal = window.Reveal;

  constructor(
    public markdown: string,
    public rSource: {css: string[], js: (string | {async?: boolean, src: string})[]} = {css: [], js: []}
  ) {
    const {data, content} = matter(markdown);
    this.headers = data;
    this.raw = content.split(/^(?:---|===)$/gm).map((el) => {
      return el.split(/^--$/gm);
    });

    this.onReady(() => {
      mainDiv.innerHTML = "";
      this.raw.map((el, i) => {
        mainDiv.appendChild(h("section", el.map((ss, j) => {
          return h("section", [
            h(".container", {innerHTML: renderDOM(ss)})
          ]);
        })));
      });

      mainDiv.querySelectorAll("pre code").forEach((block) => {
        hljs.highlightBlock(block);
      });
    });

    window.reveal = this;

    setTitle(this.headers.title);
  }

  update(markdown: string) {
    this.markdown = markdown;
    const {data, content} = matter(markdown);

    this.headers = data;
    this.onReady(() => {
      const newRaw = content.split(/^(?:---|===)$/gm).map((el, x) => {
        return el.split(/^--$/gm).map((ss, y) => {
          if (!this.raw[x] || this.raw[x][y] !== ss) {
            let container = h(".container", {innerHTML: renderDOM(ss)});
            const subSection = this.reveal.getSlide(x, y);
  
            if (subSection) {
              const oldContainers = subSection.getElementsByClassName("container");
              if (oldContainers) {
                oldContainers[0].replaceWith(container);
              } else {
                subSection.appendChild(container);
              }
            } else {
              const section = this.reveal.getSlide(x);
              if (section) {
                section.appendChild(h("section", [
                  container
                ]));
              } else {
                mainDiv.appendChild(h("section", [
                  h("section", [
                    container
                  ])
                ]));
              }
            }
  
            container.querySelectorAll("pre code").forEach((block) => {
              hljs.highlightBlock(block);
            });
          }

          return ss;
        });
      });

      this.raw.map((el, x) => {
        el.map((ss, j) => {
          const y = el.length - j - 1;

          if (!newRaw[x] || !newRaw[x][y]) {
            console.log(x, y);
            const subSection = this.reveal.getSlide(x, y);
            console.log(subSection, x, y);
            if (subSection) {
              subSection.remove();
            }
          }
        });

        if (!newRaw[x]) {
          const section = this.reveal.getSlide(x);
          if (section) {
            section.remove();
          }
        }
      });

      this.raw = newRaw;
    });

    setTitle(this.headers.title);
  }

  onReady(fn: () => void, sync: boolean = true) {
    if (this.reveal && this.reveal.isReady()) {
      fn();
      if (sync) {
        this.reveal.slide(-1, -1, -1);
        this.reveal.sync();
      }
    } else {
      this.queue.push(() => {
        fn();
      })
    }
  }
}

(window as any).RevealMaker = RevealMaker;
const reveal = new RevealMaker(window.data || "");
window.reveal = reveal;

function setTitle(s?: string) {
  let title = document.getElementsByTagName("title")[0];
  if (!title) {
    title = document.createElement("title");
    document.head.appendChild(title);
  }

  title.innerText = s || "";
}

function loadReveal() {
  reveal.rSource.css.push(
    "css/reveal.css",
    `css/theme/${reveal.headers.theme || "white"}.css`
  );
  reveal.rSource.js.push(
    {async: false, src: "js/reveal.js"}
  );

  for (const href of reveal.rSource.css) {
    document.body.appendChild(Object.assign(document.createElement("link"), {
      href: reveal.headers.offline ? href : window.revealCDN + href,
      rel: "stylesheet",
      type: "text/css"
    }));
  }

  for (let js of reveal.rSource.js) {
    if (typeof js === "string") {
      js = {async: true, src: js}
    }

    const {async, src} = js;
    document.body.appendChild(Object.assign(document.createElement("script"), {
      async,
      type: "text/javascript",
      src: reveal.headers.offline ? src : window.revealCDN + src
    }));
  }
}

loadReveal();