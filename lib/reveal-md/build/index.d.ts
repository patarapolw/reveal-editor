import "./reveal-d";
import { RevealStatic } from "reveal.js";
import { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
declare global {
    interface Window {
        Reveal: RevealStatic;
        revealMd: RevealMd;
    }
}
export declare const options: IRevealOptions;
export interface ISlide {
    lang?: string;
    comment?: string;
    content: string;
    raw: string;
}
export interface IRevealOptions {
    cdn: string;
    css: string[];
    js: (string | {
        async: boolean;
        src: string;
    })[];
}
export declare class RevealMd {
    revealMdOptions: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
    };
    raw: ISlide[][];
    queue: {
        ready: Array<(reveal?: RevealStatic) => void>;
    };
    mdConverter: showdown.Converter;
    pugConverter: (s: string) => string;
    revealOptions: IRevealOptions;
    private _headers;
    constructor(revealMdOptions?: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
    }, revealOptions?: Partial<IRevealOptions>);
    headers: any;
    update(markdown: string): void;
    onReady(fn: (reveal?: RevealStatic) => void): void;
    once(type: string, listener: () => void): void;
    setTitle(s?: string): void;
    parseSlide(text: string): ISlide;
    buildSlide(slide: ISlide): string;
    getSlide(x: number, y?: number): (Window & Document & HTMLElement & HTMLAnchorElement & HTMLAppletElement & HTMLAreaElement & HTMLAudioElement & HTMLBRElement & HTMLBaseElement & HTMLBaseFontElement & HTMLBodyElement & HTMLButtonElement & HTMLCanvasElement & HTMLDListElement & HTMLDataElement & HTMLDataListElement & HTMLDetailsElement & HTMLDialogElement & HTMLDirectoryElement & HTMLDivElement & HTMLEmbedElement & HTMLFieldSetElement & HTMLFontElement & HTMLFormElement & HTMLFrameElement & HTMLFrameSetElement & HTMLHRElement & HTMLHeadElement & HTMLHeadingElement & HTMLHtmlElement & HTMLIFrameElement & HTMLImageElement & HTMLInputElement & HTMLLIElement & HTMLLabelElement & HTMLLegendElement & HTMLLinkElement & HTMLMapElement & HTMLMarqueeElement & HTMLMediaElement & HTMLMenuElement & HTMLMetaElement & HTMLMeterElement & HTMLModElement & HTMLOListElement & HTMLObjectElement & HTMLOptGroupElement & HTMLOptionElement & HTMLOrSVGElement & HTMLOutputElement & HTMLParagraphElement & HTMLParamElement & HTMLPictureElement & HTMLPreElement & HTMLProgressElement & HTMLQuoteElement & HTMLScriptElement & HTMLSelectElement & HTMLSlotElement & HTMLSourceElement & HTMLSpanElement & HTMLStyleElement & HTMLTableCaptionElement & HTMLTableCellElement & HTMLTableColElement & HTMLTableDataCellElement & HTMLTableElement & HTMLTableHeaderCellElement & HTMLTableRowElement & HTMLTableSectionElement & HTMLTemplateElement & HTMLTextAreaElement & HTMLTimeElement & HTMLTitleElement & HTMLTrackElement & HTMLUListElement & HTMLUnknownElement & HTMLVideoElement & Element & Node) | undefined;
    /**
     *
     * @param dst Destination directory, in case of Node.js
     */
    export(dst?: string): Promise<string>;
}
export default RevealMd;
//# sourceMappingURL=index.d.ts.map