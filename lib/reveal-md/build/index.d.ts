import "./reveal-d";
import { RevealStatic } from "reveal.js";
import { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
import { Cash } from "cash-dom";
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
    private _dom;
    constructor(revealMdOptions?: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
    }, revealOptions?: Partial<IRevealOptions>);
    readonly isBrowser: boolean;
    headers: any;
    init(): Promise<void>;
    readonly window: Window & {
        Reveal?: RevealStatic;
        revealMd?: RevealMd;
    };
    readonly reveal: RevealStatic | undefined;
    $(selector: any, context?: any): Cash;
    update(markdown: string): Promise<unknown>;
    onReady(fn: (reveal?: RevealStatic) => void): void;
    once(type: string, listener: () => void): void;
    setTitle(s?: string): void;
    parseSlide(text: string): ISlide;
    buildSlide(slide: ISlide): string;
    getSlide(x: number, y?: number): (Window & Document & HTMLElement & HTMLAnchorElement & HTMLAppletElement & HTMLAreaElement & HTMLAudioElement & HTMLBRElement & HTMLBaseElement & HTMLBaseFontElement & HTMLBodyElement & HTMLButtonElement & HTMLCanvasElement & HTMLDListElement & HTMLDataElement & HTMLDataListElement & HTMLDetailsElement & HTMLDialogElement & HTMLDirectoryElement & HTMLDivElement & HTMLEmbedElement & HTMLFieldSetElement & HTMLFontElement & HTMLFormElement & HTMLFrameElement & HTMLFrameSetElement & HTMLHRElement & HTMLHeadElement & HTMLHeadingElement & HTMLHtmlElement & HTMLIFrameElement & HTMLImageElement & HTMLInputElement & HTMLLIElement & HTMLLabelElement & HTMLLegendElement & HTMLLinkElement & HTMLMapElement & HTMLMarqueeElement & HTMLMediaElement & HTMLMenuElement & HTMLMetaElement & HTMLMeterElement & HTMLModElement & HTMLOListElement & HTMLObjectElement & HTMLOptGroupElement & HTMLOptionElement & HTMLOrSVGElement & HTMLOutputElement & HTMLParagraphElement & HTMLParamElement & HTMLPictureElement & HTMLPreElement & HTMLProgressElement & HTMLQuoteElement & HTMLScriptElement & HTMLSelectElement & HTMLSlotElement & HTMLSourceElement & HTMLSpanElement & HTMLStyleElement & HTMLTableCaptionElement & HTMLTableCellElement & HTMLTableColElement & HTMLTableDataCellElement & HTMLTableElement & HTMLTableHeaderCellElement & HTMLTableRowElement & HTMLTableSectionElement & HTMLTemplateElement & HTMLTextAreaElement & HTMLTimeElement & HTMLTitleElement & HTMLTrackElement & HTMLUListElement & HTMLUnknownElement & HTMLVideoElement & Element & Node) | undefined;
    /**
     *
     * @param dst Folder name to store the export
     */
    export(dst: string): Promise<void>;
}
export default RevealMd;
//# sourceMappingURL=index.d.ts.map