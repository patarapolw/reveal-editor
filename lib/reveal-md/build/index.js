import "./reveal-d";
import hljs from "highlight.js";
import pug from "hyperpug";
import showdown from "showdown";
import h from "hyperscript";
import matter from "gray-matter";
import cheerio from "cheerio";
export const options = {
    cdn: "https://cdn.jsdelivr.net/npm/reveal.js@3.8.0/",
    css: [
        "css/reveal.css"
    ],
    js: [
        "js/reveal.min.js"
    ]
};
export class RevealMd {
    constructor(revealMdOptions = {}, revealOptions = {}) {
        this.revealMdOptions = revealMdOptions;
        this.raw = [[]];
        this.queue = {
            beforeReady: [],
            ready: []
        };
        this.$ = null;
        this._headers = {};
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
            markdown: (text) => {
                return this.mdConverter.makeHtml(text);
            },
            ...(revealMdOptions.pug || {})
        };
        this.pugConverter = pug.compile({ filters: pugFilters });
        if (!this.isBrowser) {
            this.$ = cheerio.load(h("html", [
                h("head", [
                    h("meta", { charset: "utf-8" })
                ]),
                h("body", [
                    h(".reveal", [
                        h(".slides")
                    ])
                ])
            ]).outerHTML);
        }
        this.init();
    }
    get isBrowser() {
        return typeof window !== "undefined";
    }
    get headers() {
        return this._headers;
    }
    set headers(h) {
        if (h.theme) {
            if (this.$) {
                this.$("#reveal-theme").attr("href", this.revealOptions.cdn + `css/theme/${h.theme}.css`);
            }
            else {
                document.getElementById("reveal-theme").href = this.revealOptions.cdn + `css/theme/${h.theme}.css`;
            }
        }
        if (this.$) {
            this.$("link.reveal-css").each((_, el) => {
                const link = el;
                if (!link.href.startsWith(this.revealOptions.cdn)) {
                    link.href = this.revealOptions.cdn + link.href;
                }
            });
        }
        else {
            Array.from(document.querySelectorAll("link.reveal-css")).forEach((el) => {
                const link = el;
                if (!link.href.startsWith(this.revealOptions.cdn)) {
                    link.href = this.revealOptions.cdn + link.href;
                }
            });
        }
        if (this.$) {
            this.$("script.reveal-js").each((_, el) => {
                const script = el;
                if (!script.src.startsWith(this.revealOptions.cdn)) {
                    script.src = this.revealOptions.cdn + script.src;
                }
            });
        }
        else {
            Array.from(document.querySelectorAll("script.reveal-js")).forEach((el) => {
                const script = el;
                if (!script.src.startsWith(this.revealOptions.cdn)) {
                    script.src = this.revealOptions.cdn + script.src;
                }
            });
        }
        this.onReady((reveal) => {
            reveal.configure(h);
        });
        this._headers = h;
    }
    init() {
        const window = this.window;
        if (window) {
            window.revealMd = this;
        }
        let $body;
        if (this.$) {
            $body = this.$("body");
            for (const href of this.revealOptions.css) {
                $body.append(this.$("<link>").attr({
                    class: "reveal-css",
                    className: "reveal-css",
                    href: this.revealOptions.cdn + href,
                    rel: "stylesheet",
                    type: "text/css"
                }).html() || "");
            }
            $body.append(this.$("<link>").attr({
                id: "reveal-theme",
                class: "reveal-css",
                className: "reveal-css",
                href: this.revealOptions.cdn + "css/theme/white.css",
                rel: "stylesheet",
                type: "text/css"
            }).html() || "");
        }
        else {
            for (const href of this.revealOptions.css) {
                document.body.appendChild(Object.assign(document.createElement("link"), {
                    className: "reveal-css",
                    href: this.revealOptions.cdn + href,
                    rel: "stylesheet",
                    type: "text/css"
                }));
            }
            document.body.appendChild(Object.assign(document.createElement("link"), {
                id: "reveal-theme",
                className: "reveal-css",
                href: this.revealOptions.cdn + "css/theme/white.css",
                rel: "stylesheet",
                type: "text/css"
            }));
        }
        for (let js of this.revealOptions.js) {
            if (!this.$) {
                if (typeof js === "string") {
                    document.body.appendChild(Object.assign(document.createElement("script"), {
                        className: "reveal-js",
                        type: "text/javascript",
                        src: this.revealOptions.cdn + js
                    }));
                }
                else {
                    const { async, src } = js;
                    document.body.appendChild(Object.assign(document.createElement("script"), {
                        className: "reveal-js",
                        async,
                        type: "text/javascript",
                        src: this.revealOptions.cdn + src
                    }));
                }
            }
            else {
                if (typeof js === "string") {
                    $body.append(this.$("<script>").attr({
                        class: "reveal-js",
                        className: "reveal-js",
                        type: "text/javascript",
                        src: this.revealOptions.cdn + js
                    }).html() || "");
                }
                else {
                    const { async, src } = js;
                    $body.append(this.$("<script>").attr({
                        class: "reveal-js",
                        className: "reveal-js",
                        async,
                        type: "text/javascript",
                        src: this.revealOptions.cdn + src
                    }).html() || "");
                }
            }
        }
        if (this.window) {
            this.window.addEventListener("load", () => {
                const reveal = this.window.Reveal;
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
    get window() {
        if (this.isBrowser) {
            return window;
        }
        else {
            return null;
        }
    }
    get reveal() {
        return this.window ? this.window.Reveal : null;
    }
    update(markdown) {
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
                            if (this.$) {
                                this.$("head").append(this.$("<div style='display: none;'>").append(sectionRaw.content).html() || "");
                            }
                            else {
                                const div = document.createElement("div");
                                div.style.display = "none";
                                div.innerHTML = sectionRaw.content;
                                document.head.appendChild(div);
                            }
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
                        if (this.$) {
                            const container = this.$("<div class='container'>");
                            container.html(thisRaw.content);
                            let subSection = this.getSlide(x, y);
                            let section = this.getSlide(x);
                            if (section && subSection) {
                                const oldContainers = this.$(".container", this.$(subSection));
                                oldContainers.remove();
                                this.$(subSection).append(container.html() || "");
                            }
                            else {
                                const ss = this.$("<section>");
                                ss.append(container.html() || "");
                                if (section) {
                                    this.$(section).append(ss.html() || "");
                                }
                                else {
                                    const s = this.$("<section>");
                                    s.append(ss.html() || "");
                                    this.$(".reveal .slides").append(s.html() || "");
                                }
                            }
                            this.$("pre code", container).each((_, el) => {
                                hljs.highlightBlock(el);
                            });
                        }
                        else {
                            const container = document.createElement("div");
                            container.className = "container";
                            container.innerHTML = thisRaw.content;
                            let subSection = this.getSlide(x, y);
                            let section = this.getSlide(x);
                            if (section && subSection) {
                                subSection.innerHTML = "";
                                subSection.appendChild(container);
                            }
                            else {
                                const ss = document.createElement("section");
                                ss.appendChild(container);
                                if (section) {
                                    section.appendChild(ss);
                                }
                                else {
                                    const s = document.createElement("section");
                                    s.appendChild(ss);
                                    document.querySelector(".reveal .slides").appendChild(s);
                                }
                            }
                            Array.from(container.querySelectorAll("pre code")).forEach((el) => {
                                hljs.highlightBlock(el);
                            });
                        }
                    }
                    return thisRaw;
                });
            }).filter((el) => el !== null);
            this.raw.map((el, x) => {
                el.map((ss, j) => {
                    const y = el.length - j - 1;
                    if (!newRaw[x] || !newRaw[x][y]) {
                        const subSection = this.getSlide(x, y);
                        if (subSection) {
                            if (this.$) {
                                this.$(subSection).remove();
                            }
                            else {
                                subSection.remove();
                            }
                        }
                    }
                });
                if (!newRaw[x]) {
                    const section = this.getSlide(x);
                    if (section) {
                        if (this.$) {
                            this.$(section).remove();
                        }
                        else {
                            section.remove();
                        }
                    }
                }
            });
            this.raw = newRaw;
        };
        if (this.isBrowser) {
            this.onReady(() => setBody());
        }
        else {
            setBody();
        }
        this.setTitle(this.headers.title);
    }
    onReady(fn) {
        const reveal = this.reveal;
        if (reveal && reveal.isReady()) {
            fn(reveal);
            // reveal.slide(-1, -1, -1);
            // reveal.sync();
        }
        else {
            this.queue.ready.push(fn);
        }
    }
    once(type, listener) {
        const reveal = this.reveal;
        if (reveal && reveal.isReady) {
            const removeOnDone = () => {
                listener();
                reveal.removeEventListener(type, removeOnDone);
            };
            reveal.addEventListener(type, removeOnDone);
        }
        else {
            this.queue.ready.push(listener);
        }
    }
    setTitle(s) {
        if (this.$) {
            let $title = this.$("title");
            if ($title.length === 0) {
                const title = this.$("<title>");
                title.text(s || "");
                this.$("head").append(title.html() || "");
            }
            else {
                $title.text(s || "");
            }
        }
        else {
            const title = document.getElementsByTagName("title")[0];
            if (title) {
                title.text = s || "";
            }
            else {
                document.head.appendChild(Object.assign(document.createElement("title"), {
                    innerText: s || ""
                }));
            }
        }
    }
    parseSlide(text) {
        const raw = text;
        let lang = "";
        let commentLines = [];
        let contentLines = [];
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
            case "markdown":
                html = this.mdConverter.makeHtml(html);
                break;
            case "html": break;
            case "pug":
                html = this.pugConverter(html);
                break;
            default:
                const pre = h("pre");
                pre.innerText = html;
                html = pre.outerHTML;
        }
        return { lang, comment, content: html, raw };
    }
    buildSlide(slide) {
        const resultArray = [];
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
    getSlide(x, y) {
        let hSlide;
        if (this.$) {
            const s = this.$(".slides > section");
            hSlide = s[x];
            if (typeof y === "number") {
                if (hSlide) {
                    const vSlides = this.$(hSlide).children("section");
                    return vSlides[y];
                }
                return undefined;
            }
        }
        else {
            const s = document.querySelectorAll(".slides > section");
            hSlide = s[x];
            if (typeof y === "number") {
                if (hSlide) {
                    const vSlides = hSlide.getElementsByTagName("section");
                    return vSlides[y];
                }
                return undefined;
            }
        }
        return hSlide;
    }
    /**
     *
     * @param dst Folder name to store the export
     */
    async export(dst) {
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
        fs.writeFileSync(normalize(`${dst}/index.html`), this.$.xml());
    }
}
export default RevealMd;
