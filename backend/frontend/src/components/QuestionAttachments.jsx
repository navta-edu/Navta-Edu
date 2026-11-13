import { useEffect, useState } from "react";

const maxImages = 4;
const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

export function getQuestionAttachments(question) {
  const seen = new Set();
  const extras = Array.isArray(question?.questionImages) ? question.questionImages : [];
  return [question?.questionImage, ...extras].filter(image => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function questionAttachmentRequest(payload, images, edit = false) {
  const files = new FormData();
  let index = 0;
  const attachments = images.map(({ file, url, altText }) => {
    if (!file) return { url, altText: altText || "" };
    files.append("images", file);
    return { fileIndex: index++, altText: altText || "" };
  });
  const body = edit ? { ...payload, changes: { ...payload.changes, attachments } } : { ...payload, attachments };
  if (!index) return { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } };
  files.append("payload", JSON.stringify(body));
  return { body: files, headers: {} };
}

function AttachmentPreview({ file, url, altText }) {
  const [objectUrl, setObjectUrl] = useState("");
  useEffect(() => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setObjectUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  const src = url || objectUrl;
  return src && <img src={src} alt={altText || "Question image"} className="h-24 w-full object-contain" />;
}

export default function QuestionAttachments({ images, onChange, disabled }) {
  const [error, setError] = useState("");

  function addImages(event) {
    const files = Array.from(event.target.files);
    event.target.value = "";
    if (!files.length) return;
    if (images.length + files.length > maxImages) return setError(`Add up to ${maxImages} images.`);
    if (files.some(file => !allowedTypes.includes(file.type))) return setError("Use PNG, JPG or WebP images.");
    if (files.some(file => !file.size || file.size > 5 * 1024 * 1024)) return setError("Each image must be 5 MB or smaller.");
    setError("");
    onChange([...images, ...files.map(file => ({ file, id: crypto.randomUUID(), altText: "" }))]);
  }

  return (
    <fieldset disabled={disabled} className="w-full space-y-3 rounded-xl border border-slate-300 p-3 dark:border-slate-700">
      <legend className="px-1 text-sm font-semibold">Diagrams and pictures</legend>
      <label className="block space-y-1 text-sm">
        <span>Add images</span>
        <input type="file" multiple accept={allowedTypes.join(",")} disabled={images.length >= maxImages} onChange={addImages} className="block w-full text-sm" />
      </label>
      <p className="text-xs opacity-80">Up to 4 PNG, JPG or WebP images, 5 MB each.</p>
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      {images.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {images.map((image, index) => (
            <li key={image.id || image.url} className="min-w-0 space-y-2 rounded-lg border border-slate-300 p-2 dark:border-slate-700">
              <AttachmentPreview {...image} />
              <label className="block space-y-1 text-xs">
                <span>Image {index + 1} description</span>
                <input className="admin-navta-input" maxLength={200} value={image.altText || ""} onChange={event => onChange(images.map((item, i) => i === index ? { ...item, altText: event.target.value } : item))} />
              </label>
              <button type="button" className="admin-navta-secondary-button" onClick={() => {
                setError("");
                onChange(images.filter((_, i) => i !== index));
              }}>Remove image {index + 1}</button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
