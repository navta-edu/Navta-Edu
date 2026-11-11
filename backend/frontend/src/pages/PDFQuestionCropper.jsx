import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crop,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  SUBJECT_EXAMS,
  DIFFICULTIES,
  CLASSES,
  CHAPTERS,
} from "./AdminNavtaTest";
import {
  getQuestionCropLayers,
  removeLightGrayWatermark,
} from "../utils/pdfQuestionCrop";

function getAdminAuthToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("accessToken") ||
    ""
  );
}

function buildAdminHeaders(extraHeaders = {}) {
  const token = getAdminAuthToken();

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const fieldClass =
  "w-full min-h-[46px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500";

const labelClass =
  "mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function PDFQuestionCropper() {
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const cropLayersRef = useRef(null);
  const pageRenderedRef = useRef(false);
  const dragStartRef = useRef(null);

  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [fitToWidth, setFitToWidth] = useState(false);

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.35);

  const [selection, setSelection] = useState(null);
  const [cropPreview, setCropPreview] = useState("");
  const [removeFaintWatermark, setRemoveFaintWatermark] = useState(false);
  const [watermarkStrength, setWatermarkStrength] = useState(20);

  const [subject, setSubject] = useState("");
  const [exam, setExam] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const availableExams = useMemo(
    () => (subject ? SUBJECT_EXAMS[subject] || [] : []),
    [subject]
  );

  const availableChapters = useMemo(
    () =>
      subject && classLevel
        ? CHAPTERS[subject]?.[classLevel] || []
        : [],
    [subject, classLevel]
  );

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= 767);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    return () => {
      pdfDocumentRef.current?.destroy().catch(() => {});
    };
  }, []);

  const loadPdfJs = async () => {
    const pdfjsLib = await import("pdfjs-dist");

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      const workerModule = await import(
        "pdfjs-dist/build/pdf.worker.min.mjs?url"
      );
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
    }

    return pdfjsLib;
  };

  useEffect(() => {
    const pdf = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    const cropLayers = cropLayersRef.current;

    if (!pdfFile || pdfLoading || !pdf || !canvas) return;

    let active = true;
    let renderTask;
    pageRenderedRef.current = false;
    dragStartRef.current = null;
    setSelection(null);
    setCropPreview("");
    setMessage("");

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      if (!active) return;

      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;

      renderTask = page.render({
        canvasContext: context,
        viewport,
        optionalContentConfigPromise: Promise.resolve(cropLayers),
      });

      await renderTask.promise;
      if (active) pageRenderedRef.current = true;
    };

    renderPage().catch((error) => {
      if (!active || error?.name === "RenderingCancelledException") return;
      console.error("PDF page render error:", error);
      setPdfError("Unable to render this PDF page.");
    });

    return () => {
      active = false;
      pageRenderedRef.current = false;
      renderTask?.cancel();
    };
  }, [pdfFile, pdfLoading, pageNumber, scale, isMobileViewport, fitToWidth]);

  const handlePdfFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setPdfError("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    setPdfLoading(true);
    setPdfError("");
    setMessage("");
    setSelection(null);
    setCropPreview("");

    try {
      const pdfjsLib = await loadPdfJs();
      const bytes = new Uint8Array(await file.arrayBuffer());

      if (pdfDocumentRef.current) {
        try {
          await pdfDocumentRef.current.destroy();
        } catch {
          // Ignore cleanup errors.
        }
      }

      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;

      pdfDocumentRef.current = pdf;
      cropLayersRef.current = await getQuestionCropLayers(pdf);

      setPdfFile(file);
      setPdfName(file.name);
      setPageCount(pdf.numPages);
      setPageNumber(1);
      setScale(1.35);
      setFitToWidth(true);
      setRemoveFaintWatermark(false);
      setWatermarkStrength(20);
    } catch (error) {
      console.error("PDF load error:", error);
      setPdfFile(null);
      setPdfName("");
      setPageCount(0);
      setPdfError(
        "Unable to open this PDF. Make sure it is a valid, non-password-protected PDF."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const getPointerPosition = (event) => {
    const overlay = overlayRef.current;
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
      width: rect.width,
      height: rect.height,
    };
  };

  const handlePointerDown = (event) => {
    if (!pageRenderedRef.current) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const point = getPointerPosition(event);
    if (!point) return;

    dragStartRef.current = point;
    setCropPreview("");
    setMessage("");

    setSelection({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      displayWidth: point.width,
      displayHeight: point.height,
    });
  };

  const getDragSelection = (event) => {
    const start = dragStartRef.current;
    if (!start) return null;
    const point = getPointerPosition(event);
    if (!point) return null;

    const x = (point.x * start.width) / point.width;
    const y = (point.y * start.height) / point.height;

    return {
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
      displayWidth: start.width,
      displayHeight: start.height,
    };
  };

  const handlePointerMove = (event) => {
    const nextSelection = getDragSelection(event);
    if (!nextSelection) return;
    event.preventDefault();
    setSelection(nextSelection);
  };

  const createCropPreview = (crop, cleanupEnabled, strength) => {
    const canvas = canvasRef.current;
    if (!canvas || !pageRenderedRef.current || !crop) return "";
    if (crop.width < 10 || crop.height < 10) return "";

    const ratioX = canvas.width / crop.displayWidth;
    const ratioY = canvas.height / crop.displayHeight;

    const sx = Math.round(crop.x * ratioX);
    const sy = Math.round(crop.y * ratioY);
    const sw = Math.max(1, Math.round((crop.x + crop.width) * ratioX) - sx);
    const sh = Math.max(1, Math.round((crop.y + crop.height) * ratioY) - sy);

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = sw;
    cropCanvas.height = sh;

    const cropContext = cropCanvas.getContext("2d");
    cropContext.fillStyle = "#ffffff";
    cropContext.fillRect(0, 0, sw, sh);

    cropContext.drawImage(
      canvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      sw,
      sh
    );

    if (cleanupEnabled) {
      const image = cropContext.getImageData(0, 0, sw, sh);
      removeLightGrayWatermark(image, 240 - strength);
      cropContext.putImageData(image, 0, 0);
    }

    return cropCanvas.toDataURL("image/png");
  };

  const finishSelection = (event) => {
    if (!dragStartRef.current) return;
    event.preventDefault();

    const crop = event.type === "pointercancel" ? selection : getDragSelection(event);
    dragStartRef.current = null;
    setSelection(crop);
    setCropPreview(createCropPreview(crop, removeFaintWatermark, watermarkStrength));
  };

  const updateWatermarkCleanup = (enabled, strength) => {
    setRemoveFaintWatermark(enabled);
    setWatermarkStrength(strength);
    setCropPreview(createCropPreview(selection, enabled, strength));
  };

  const resetCrop = () => {
    setSelection(null);
    setCropPreview("");
    setMessage("");
  };

  const changePage = (nextPage) => {
    if (!pageCount) return;

    const safePage = clamp(nextPage, 1, pageCount);

    if (safePage === pageNumber) return;

    setPageNumber(safePage);
    setSelection(null);
    setCropPreview("");
  };

  const changeScale = (nextScale) => {
    const safeScale = clamp(Number(nextScale.toFixed(2)), 0.7, 2.5);

    if (isMobileViewport && safeScale > scale) {
      setFitToWidth(false);
    }

    if (isMobileViewport && safeScale <= 0.85) {
      setFitToWidth(true);
    }

    setScale(safeScale);
  };

  const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const validateQuestion = () => {
    if (!pdfFile) return "Select a PDF first.";
    if (!cropPreview) return "Crop a question from the PDF first.";
    if (!subject) return "Select a subject.";
    if (!exam) return "Select a preparation mode.";
    if (!classLevel) return "Select a class.";
    if (!chapter) return "Select a chapter.";
    if (!difficulty) return "Select a difficulty.";
    if (correctAnswer === "") return "Select the correct answer A, B, C or D.";

    return "";
  };

  const saveQuestion = async ({ moveNext = false } = {}) => {
    const validationError = validateQuestion();

    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const blob = await dataUrlToBlob(cropPreview);
      const formData = new FormData();

      formData.append(
        "questionImage",
        blob,
        `navta-${subject}-${classLevel}-page-${pageNumber}-${Date.now()}.png`
      );

      formData.append("subject", subject);
      formData.append("exam", exam);
      formData.append("classLevel", classLevel);
      formData.append("chapter", chapter);
      formData.append("difficulty", difficulty);
      formData.append("questionType", "mcq");
      formData.append("correctAnswer", String(correctAnswer));

      formData.append("optionA", "A");
      formData.append("optionB", "B");
      formData.append("optionC", "C");
      formData.append("optionD", "D");

      formData.append("sourceType", "pdf-crop");
      formData.append("sourcePdfName", pdfName);
      formData.append("sourcePage", String(pageNumber));

      if (selection) {
        formData.append("cropX", String(Math.round(selection.x)));
        formData.append("cropY", String(Math.round(selection.y)));
        formData.append("cropWidth", String(Math.round(selection.width)));
        formData.append("cropHeight", String(Math.round(selection.height)));
      }

      /*
       * This route is intentionally dedicated to PDF-cropped questions.
       * The backend step will add this endpoint and store the image in the
       * same NAVTA TEST question collection used by AdminNavtaTest.
       */
      const response = await fetch(
        "/api/navta-test/questions/pdf-crop",
        {
          method: "POST",
          credentials: "include",
          headers: buildAdminHeaders(),
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "The cropper page is ready, but the PDF-crop backend endpoint has not been connected yet."
        );
      }

      setSavedCount((previous) => previous + 1);
      setMessageType("success");
      setMessage(data.message || "Question saved to NAVTA TEST successfully.");

      setSelection(null);
      setCropPreview("");
      setCorrectAnswer("");

      if (moveNext && pageNumber < pageCount) {
        changePage(pageNumber + 1);
      }
    } catch (error) {
      console.error("PDF crop question save error:", error);

      setMessageType("error");
      setMessage(
        error.message ||
          "Unable to save the cropped question."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Crop className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  PDF Question Cropper
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Crop questions directly from a PDF and classify them for NAVTA TEST.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Saved this session
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {savedCount}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/navta-test")}
              className="min-h-[46px] rounded-xl bg-slate-900 dark:bg-white px-4 text-sm font-bold text-white dark:text-slate-900"
            >
              Open Navta TEST
            </button>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)] gap-6">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white">
                  1. Select PDF
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  The PDF stays in your browser while you crop questions.
                </p>
              </div>

              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700">
                <Upload className="w-4 h-4" />
                {pdfFile ? "Change PDF" : "Choose PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfFile}
                  disabled={pdfLoading}
                  className="hidden"
                />
              </label>
            </div>

            {pdfName && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900 p-3">
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {pdfName}
                </span>
                <span className="text-xs text-slate-400">
                  {pageCount} page{pageCount === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {pdfError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                {pdfError}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white">
                  2. Crop Question
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Drag over the complete question, including its printed options and diagram.
                </p>
              </div>

              {pageCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changePage(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Page {pageNumber} / {pageCount}
                  </div>

                  <button
                    type="button"
                    onClick={() => changePage(pageNumber + 1)}
                    disabled={pageNumber >= pageCount}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="w-px h-7 bg-slate-200 dark:bg-slate-800 mx-1" />

                  <button
                    type="button"
                    onClick={() => changeScale(scale - 0.15)}
                    disabled={scale <= 0.7}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="min-w-[52px] text-center text-xs font-bold text-slate-500">
                    {Math.round(scale * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => changeScale(scale + 0.15)}
                    disabled={scale >= 2.5}
                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center disabled:opacity-40"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={resetCrop}
                    className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 px-3 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>

                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={() => {
                        setFitToWidth(true);
                        setScale(1.35);
                      }}
                      className={`h-10 rounded-xl border px-3 text-xs font-bold ${
                        fitToWidth
                          ? "border-primary-500 bg-primary-500/10 text-primary-600"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Fit Width
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="min-h-[360px] md:min-h-[560px] bg-slate-100 dark:bg-slate-900/60 overflow-auto p-2 sm:p-4 md:p-6">
              {pdfLoading ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-500" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Loading PDF...
                    </p>
                  </div>
                </div>
              ) : !pdfFile ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <div className="max-w-sm text-center">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-white dark:bg-slate-950 flex items-center justify-center shadow-sm">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 font-extrabold text-slate-800 dark:text-white">
                      Select a PDF to begin
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      After loading, the complete page will appear here and you can drag a crop box around each question.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full min-w-0 md:w-max md:min-w-full flex justify-center overflow-x-auto">
                  <div className="relative inline-block w-fit max-w-full shadow-xl bg-white select-none">
                    <canvas ref={canvasRef} className="block max-w-full h-auto md:max-w-none" />

                    <div
                      ref={overlayRef}
                      className="absolute inset-0 cursor-crosshair touch-none"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={finishSelection}
                      onPointerCancel={finishSelection}
                    >
                      {selection && (
                        <div
                          className="absolute border-2 border-primary-500 bg-primary-500/10 pointer-events-none"
                          style={{
                            left: `${(selection.x / selection.displayWidth) * 100}%`,
                            top: `${(selection.y / selection.displayHeight) * 100}%`,
                            width: `${(selection.width / selection.displayWidth) * 100}%`,
                            height: `${(selection.height / selection.displayHeight) * 100}%`,
                            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.18)",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-500" />
              <h2 className="font-extrabold text-slate-900 dark:text-white">
                Crop Preview
              </h2>
            </div>

            {cropPreview && (
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={removeFaintWatermark}
                    onChange={(event) => updateWatermarkCleanup(event.target.checked, watermarkStrength)}
                    className="h-4 w-4 accent-primary-600"
                  />
                  Remove faint gray watermark
                </label>

                {removeFaintWatermark && (
                  <>
                    <label className="flex flex-col gap-1">
                      Cleanup strength
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={watermarkStrength}
                        onChange={(event) => updateWatermarkCleanup(removeFaintWatermark, Number(event.target.value))}
                        className="w-full accent-primary-600"
                      />
                    </label>
                    <p className="text-xs">
                      Check the printed options and any pale diagram details before saving.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 min-h-[190px] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden p-3">
              {cropPreview ? (
                <img
                  src={cropPreview}
                  alt="Cropped question preview"
                  className="max-w-full max-h-[360px] object-contain"
                />
              ) : (
                <p className="px-6 text-center text-sm text-slate-400">
                  Drag over a question on the PDF to create its preview.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 shadow-sm">
            <h2 className="font-extrabold text-slate-900 dark:text-white">
              3. Question Classification
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>Subject</label>
                <select
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setExam("");
                    setClassLevel("");
                    setChapter("");
                  }}
                  className={fieldClass}
                >
                  <option value="">Select subject</option>
                  {Object.keys(SUBJECT_EXAMS).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Preparation</label>
                <select
                  value={exam}
                  disabled={!subject}
                  onChange={(event) => setExam(event.target.value)}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">Select preparation</option>
                  {availableExams.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Class</label>
                <select
                  value={classLevel}
                  disabled={!subject}
                  onChange={(event) => {
                    setClassLevel(event.target.value);
                    setChapter("");
                  }}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">Select class</option>
                  {CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Chapter</label>
                <select
                  value={chapter}
                  disabled={!subject || !classLevel}
                  onChange={(event) => setChapter(event.target.value)}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">Select chapter</option>
                  {availableChapters.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDifficulty(item)}
                      className={`min-h-[44px] rounded-xl border text-xs font-extrabold transition ${
                        difficulty === item
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 p-5 shadow-sm">
            <h2 className="font-extrabold text-slate-900 dark:text-white">
              4. Correct Answer
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              The student will answer using A, B, C or D. The printed options remain inside the cropped image.
            </p>

            <div className="grid grid-cols-4 gap-2 mt-5">
              {["A", "B", "C", "D"].map((letter, index) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setCorrectAnswer(String(index))}
                  className={`aspect-square rounded-2xl border text-lg font-black transition ${
                    correctAnswer === String(index)
                      ? "border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-400"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuestion({ moveNext: false })}
              className="min-h-[50px] rounded-xl bg-primary-600 px-4 text-sm font-extrabold text-white hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Question
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuestion({ moveNext: true })}
              className="min-h-[50px] rounded-xl bg-slate-900 dark:bg-white px-4 text-sm font-extrabold text-white dark:text-slate-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Save & Next Page
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Workflow
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
              You can crop multiple questions from the same page. After saving, the PDF remains on the current page and your Subject, Preparation, Class, Chapter and Difficulty stay selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
