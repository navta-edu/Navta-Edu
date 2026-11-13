const multer = require("multer");
const { uploadQuestionImage, deleteQuestionImage } = require("./navtaImageService");

const maxImages = 4;
const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: maxImages, fileSize: 5 * 1024 * 1024, fields: 1, fieldSize: 1024 * 1024 },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) return callback(badRequest("Use PNG, JPG or WebP images."));
    return callback(null, true);
  },
}).array("images", maxImages);

function badRequest(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function readQuestionAttachments(req, res, next) {
  if (!req.is("multipart/form-data")) return next();
  return upload(req, res, (error) => {
    if (error) {
      let message = error.message;
      if (error.code === "LIMIT_FILE_SIZE") message = "Each image must be 5 MB or smaller.";
      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") message = `Add up to ${maxImages} question images.`;
      return res.status(400).json({ success: false, message });
    }
    try {
      req.body = JSON.parse(req.body.payload);
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw badRequest("Invalid payload.");
    } catch {
      return res.status(400).json({ success: false, message: "Invalid question upload." });
    }
    return next();
  });
}

function matchesImageType({ buffer, mimetype }) {
  if (mimetype === "image/png") return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimetype === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
  return mimetype === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

function getSavedAttachments(question) {
  const extras = Array.isArray(question.questionImages) ? question.questionImages : [];
  const images = [question.questionImage, ...extras];
  const seen = new Set();
  return images.filter(image => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

function planQuestionAttachments(entries, files = [], question = {}) {
  if (entries === undefined && !files.length) return null;
  if (!Array.isArray(entries) || entries.length > maxImages) throw badRequest(`Add up to ${maxImages} question images.`);
  const saved = new Map(getSavedAttachments(question).map(image => [image.url, image]));
  const usedFiles = new Set();
  const usedUrls = new Set();
  const plan = entries.map(entry => {
    if (!entry || typeof entry.altText !== "string" || entry.altText.trim().length > 200) {
      throw badRequest("Image descriptions must be 200 characters or fewer.");
    }
    const altText = entry.altText.trim();
    if (typeof entry.url === "string") {
      const image = saved.get(entry.url);
      if (!image || usedUrls.has(entry.url)) throw badRequest("Select a saved image or upload a new one.");
      usedUrls.add(entry.url);
      return { image, altText };
    }
    const index = entry.fileIndex;
    if (!Number.isInteger(index) || !files[index] || usedFiles.has(index) || !matchesImageType(files[index])) {
      throw badRequest("Choose a valid PNG, JPG or WebP image.");
    }
    usedFiles.add(index);
    return { file: files[index], altText };
  });
  if (usedFiles.size !== files.length) throw badRequest("Every uploaded image must be attached to the question.");
  return plan;
}

async function uploadQuestionAttachments(plan, uploadedIds) {
  const images = [];
  for (const { image, file, altText } of plan) {
    if (image) {
      images.push({ ...(image.toObject?.() ?? image), altText });
      continue;
    }
    let uploaded;
    try {
      uploaded = await uploadQuestionImage({ buffer: file.buffer, fileName: file.originalname });
    } catch {
      throw Object.assign(new Error("An image could not be uploaded. Check that it opens and try again."), { statusCode: 502 });
    }
    uploadedIds.push(uploaded.publicId);
    const { url, publicId, width, height } = uploaded;
    images.push({ url, publicId, width, height, altText });
  }
  return images;
}

async function discardUploadedAttachments(ids) {
  const results = await Promise.allSettled(ids.filter(Boolean).map(deleteQuestionImage));
  for (const result of results) {
    if (result.status === "rejected") console.error("NAVTA question image cleanup failed:", result.reason);
  }
}

module.exports = { readQuestionAttachments, getSavedAttachments, planQuestionAttachments, uploadQuestionAttachments, discardUploadedAttachments };
