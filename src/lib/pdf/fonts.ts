import { Font } from "@react-pdf/renderer";
import interItalic from "@fontsource/inter/files/inter-latin-400-italic.woff?url";
import interRoman from "@fontsource/inter/files/inter-latin-400-normal.woff?url";
import newsreaderItalic from "@fontsource/newsreader/files/newsreader-latin-400-italic.woff?url";
import newsreaderRoman from "@fontsource/newsreader/files/newsreader-latin-400-normal.woff?url";

Font.register({
	family: "Newsreader",
	fonts: [
		{ src: newsreaderRoman, fontStyle: "normal" },
		{ src: newsreaderItalic, fontStyle: "italic" },
	],
});

Font.register({
	family: "Inter",
	fonts: [
		{ src: interRoman, fontStyle: "normal" },
		{ src: interItalic, fontStyle: "italic" },
	],
});

Font.registerHyphenationCallback((word) => [word]);
