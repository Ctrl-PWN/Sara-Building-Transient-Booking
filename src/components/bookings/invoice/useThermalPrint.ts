import type { DocumentProps } from "@react-pdf/renderer";
import { type ReactElement, useCallback, useRef, useState } from "react";

type PrintStatus = "idle" | "preparing" | "ready" | "printing" | "error";

type PrintableDocument = ReactElement<DocumentProps>;

type UseThermalPrintResult = {
	status: PrintStatus;
	error: string | null;
	print: (element: PrintableDocument) => Promise<void>;
	reset: () => void;
};

export function useThermalPrint(): UseThermalPrintResult {
	const [status, setStatus] = useState<PrintStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const blobUrlRef = useRef<string | null>(null);
	const printedRef = useRef(false);

	const cleanup = useCallback(() => {
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
		const iframe = iframeRef.current;
		iframeRef.current = null;
		if (iframe?.parentNode) {
			iframe.parentNode.removeChild(iframe);
		}
	}, []);

	const reset = useCallback(() => {
		cleanup();
		printedRef.current = false;
		setStatus("idle");
		setError(null);
	}, [cleanup]);

	const print = useCallback(
		async (element: PrintableDocument) => {
			setError(null);
			setStatus("preparing");
			let blobUrl: string | null = null;
			try {
				const { pdf } = await import("@react-pdf/renderer");
				const blob = await pdf(element).toBlob();
				blobUrl = URL.createObjectURL(blob);
				blobUrlRef.current = blobUrl;

				const iframe = document.createElement("iframe");
				iframe.style.position = "fixed";
				iframe.style.right = "0";
				iframe.style.bottom = "0";
				iframe.style.width = "0";
				iframe.style.height = "0";
				iframe.style.border = "0";
				iframe.setAttribute("aria-hidden", "true");
				iframe.src = blobUrl;

				document.body.appendChild(iframe);
				iframeRef.current = iframe;

				const win = iframe.contentWindow;
				if (!win) {
					throw new Error("Unable to access the print frame.");
				}

				await new Promise<void>((resolve, reject) => {
					const onLoad = () => {
						iframe.removeEventListener("load", onLoad);
						resolve();
					};
					const onError = () => {
						iframe.removeEventListener("error", onError);
						reject(new Error("Failed to load the print frame."));
					};
					iframe.addEventListener("load", onLoad);
					iframe.addEventListener("error", onError);
					if (iframe.contentDocument?.readyState === "complete") {
						onLoad();
					}
				});

				setStatus("ready");
				setStatus("printing");
				win.focus();
				win.print();

				printedRef.current = true;
				const handleAfterPrint = () => {
					win.removeEventListener("afterprint", handleAfterPrint);
					cleanup();
					setStatus("idle");
				};
				win.addEventListener("afterprint", handleAfterPrint);

				setTimeout(() => {
					if (printedRef.current && iframeRef.current === iframe) {
						handleAfterPrint();
					}
				}, 60_000);
			} catch (err) {
				if (blobUrl && !blobUrlRef.current) {
					URL.revokeObjectURL(blobUrl);
				}
				cleanup();
				const message =
					err instanceof Error ? err.message : "Failed to print receipt.";
				setError(message);
				setStatus("error");
			}
		},
		[cleanup],
	);

	return { status, error, print, reset };
}
