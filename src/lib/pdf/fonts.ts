import { Font } from "@react-pdf/renderer";
import interRoman from "@/assets/fonts/Inter.ttf?url";
import interItalic from "@/assets/fonts/Inter-Italic.ttf?url";
import newsreaderRoman from "@/assets/fonts/Newsreader.ttf?url";
import newsreaderItalic from "@/assets/fonts/Newsreader-Italic.ttf?url";

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
