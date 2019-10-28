import "./reveal-d";
import { RevealStatic } from "reveal.js";
import { IHyperPugFilters } from "hyperpug";
import showdown from "showdown";
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
        beforeReady: Array<(reveal: RevealStatic) => void>;
        ready: Array<(reveal: RevealStatic) => void>;
    };
    mdConverter: showdown.Converter;
    pugConverter: (s: string) => string;
    revealOptions: IRevealOptions;
    $: CheerioStatic | null;
    private _headers;
    constructor(revealMdOptions?: {
        markdown?: showdown.ShowdownExtension[];
        pug?: IHyperPugFilters;
    }, revealOptions?: Partial<IRevealOptions>);
    readonly isBrowser: boolean;
    headers: any;
    init(): void;
    readonly window: Window & {
        Reveal?: RevealStatic;
        revealMd?: RevealMd;
    } | null;
    readonly reveal: RevealStatic | null | undefined;
    update(markdown: string): void;
    onReady(fn: (reveal: RevealStatic) => void): void;
    once(type: string, listener: () => void): void;
    setTitle(s?: string): void;
    parseSlide(text: string): ISlide;
    buildSlide(slide: ISlide): string;
    getSlide(x: number, y?: number): CheerioElement | Element | undefined;
    /**
     *
     * @param dst Folder name to store the export
     */
    export(dst: string): Promise<void>;
}
export default RevealMd;
//# sourceMappingURL=index.d.ts.map