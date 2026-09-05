/*
|--------------------------------------------------------------------------
| PDF FIRST PAGE PREVIEW
|--------------------------------------------------------------------------
*/

function PdfFirstPagePreview({ pdfUrl }) {
  const previewRef = useRef(null);

  const [previewWidth, setPreviewWidth] = useState(700);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [pdfSource, setPdfSource] = useState(null);

  useEffect(() => {
    if (!pdfUrl) {
      setPdfSource(null);
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");

    let cancelled = false;

    const loadPdf = async () => {
      try {
        console.log("NAVTA PDF URL:", pdfUrl);

        const response = await fetch(pdfUrl, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
        });

        console.log("NAVTA PDF response:", {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get("content-type"),
        });

        if (!response.ok) {
          throw new Error(
            `PDF request failed with status ${response.status}`
          );
        }

        const contentType =
          response.headers.get("content-type") || "";

        if (
          !contentType.includes("application/pdf") &&
          !contentType.includes("application/octet-stream")
        ) {
          console.warn(
            "Unexpected PDF content type:",
            contentType
          );
        }

        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error("Downloaded PDF is empty.");
        }

        const objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setPdfSource(objectUrl);
        }
      } catch (error) {
        console.error("NAVTA PDF preview fetch failed:", error);

        if (!cancelled) {
          setPreviewError(
            error?.message || "Unable to load PDF preview."
          );
          setPreviewLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    const element = previewRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const width =
        element.getBoundingClientRect().width;

      if (width > 0) {
        setPreviewWidth(
          Math.max(
            240,
            Math.min(width - 24, 760)
          )
        );
      }
    };

    updateWidth();

    const observer =
      new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800/40">

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            PDF Preview
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            Previewing page 1 only
          </p>
        </div>

        <span className="rounded-full border border-primary-500/20 bg-primary-500/5 px-2.5 py-1 text-[10px] font-bold text-primary-500">
          PAGE 1
        </span>

      </div>

      <div
        ref={previewRef}
        className="relative flex min-h-[220px] w-full min-w-0 justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-700 dark:bg-slate-950/40 sm:p-4"
      >

        {previewLoading && !previewError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-slate-950/90">

            <div className="flex flex-col items-center gap-3">

              <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Loading PDF preview...
              </p>

            </div>

          </div>
        )}

        {previewError ? (

          <div className="flex min-h-[220px] w-full flex-col items-center justify-center px-4 text-center">

            <FileText className="mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />

            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Preview unavailable
            </p>

            <p className="mt-1 max-w-md text-xs leading-relaxed text-red-500">
              {previewError}
            </p>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white"
            >
              Open PDF
            </a>

          </div>

        ) : pdfSource ? (

          <Document
            file={pdfSource}
            loading={null}
            onLoadSuccess={() => {
              console.log("NAVTA PDF loaded successfully");
            }}
            onLoadError={(error) => {
              console.error(
                "NAVTA PDF Document error:",
                error
              );

              setPreviewError(
                error?.message ||
                "The PDF could not be rendered."
              );

              setPreviewLoading(false);
            }}
          >

            <Page
              pageNumber={1}
              width={previewWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
              onRenderSuccess={() => {
                console.log(
                  "NAVTA PDF page 1 rendered"
                );

                setPreviewLoading(false);
              }}
              onRenderError={(error) => {
                console.error(
                  "NAVTA PDF page render error:",
                  error
                );

                setPreviewError(
                  error?.message ||
                  "Page 1 could not be rendered."
                );

                setPreviewLoading(false);
              }}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            />

          </Document>

        ) : null}

      </div>

    </div>
  );
}
