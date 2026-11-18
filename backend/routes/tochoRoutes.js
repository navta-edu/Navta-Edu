const express = require("express");
const multer = require("multer");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { protect, authorizeRoles } = require("../middleware/auth");
const { subjects, classes, exams } = require("../services/tochoScan");
const chapterConfig = require("../config/navtaChapters");
const books = require("../services/tochoBooks");

const admin = express.Router();
const notes = express.Router();
const upload = multer({ limits: { fileSize: books.chunkBytes + 1, files: 1, fields: 0, parts: 2 } }).single("part");
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const owner = req => req.user._id;
const integer = (value, fallback) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= 100000 ? number : fallback;
};

admin.use(protect, authorizeRoles("admin"));
admin.get("/config", (req, res) => res.json({ subjects, classes, exams, maxBytes: books.maxBytes, chunkBytes: books.chunkBytes }));
admin.get("/jobs", asyncRoute(async (req, res) => res.json({ jobs: await books.listJobs(owner(req)) })));
admin.post("/jobs", asyncRoute(async (req, res) => {
  const { fileName, size, fingerprint, hints: input = {} } = req.body || {};
  if (typeof fileName !== "string" || fileName.length > 240 || !/\.(pdf|docx)$/i.test(fileName) ||
      /[\\/\u0000-\u001f]/.test(fileName)) return res.status(400).json({ message: "Choose a PDF or Word (.docx) file." });
  if (!Number.isSafeInteger(size) || size < 22 || size > books.maxBytes) {
    return res.status(400).json({ message: "Choose a readable book up to 250 MB." });
  }
  if (typeof fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(fingerprint)) {
    return res.status(400).json({ message: "Invalid file fingerprint. Select the book again." });
  }
  const title = String(req.body.title || fileName.replace(/\.(pdf|docx)$/i, "")).trim();
  if (!title || title.length > 160 || /[\u0000-\u001f]/.test(title)) return res.status(400).json({ message: "Enter a book title up to 160 characters." });
  const { subject = "", classLevel = "", exam = "", chapter = "" } = input || {};
  if ((subject && !subjects.includes(subject)) || (classLevel && !classes.includes(classLevel)) ||
      (exam && !exams.includes(exam)) || (chapter && !chapterConfig.getChaptersForSubject(subject, classLevel).includes(chapter))) {
    return res.status(400).json({ message: "Choose a valid curriculum hint." });
  }
  const job = await books.createJob({ owner: owner(req), fileName, size, fingerprint, title, hints: { subject, classLevel, exam, chapter } });
  res.status(201).json({ job });
}));
admin.put("/jobs/:id/parts/:number", upload, asyncRoute(async (req, res) => {
  if (!/^\d+$/.test(req.params.number)) return res.status(400).json({ message: "Invalid upload part." });
  await books.saveChunk(req.params.id, owner(req), Number(req.params.number), req.file?.buffer);
  res.sendStatus(204);
}));
admin.post("/jobs/:id/start", asyncRoute(async (req, res) => {
  await books.startJob(req.params.id, owner(req));
  res.status(202).json({ job: await books.getJob(req.params.id, owner(req)) });
}));
admin.get("/jobs/:id", asyncRoute(async (req, res) => res.json({ job: await books.getJob(req.params.id, owner(req)) })));
admin.get("/jobs/:id/review", asyncRoute(async (req, res) => {
  res.json({ items: await books.readReview(req.params.id, owner(req), integer(req.query.unit, 1)) });
}));

notes.use(protect);
notes.get("/", asyncRoute(async (req, res) => res.json(await books.listBooks(integer(req.query.page, 1)))));
notes.get("/:id", asyncRoute(async (req, res) => {
  const book = await books.publishedBook(req.params.id);
  const sections = await books.readSections(book, integer(req.query.page, 1));
  res.json({ book, sections: sections.slice(0, 10), hasMore: sections.length > 10 });
}));
notes.get("/:id/download", asyncRoute(async (req, res) => {
  const book = await books.publishedBook(req.params.id);
  res.attachment(`${book.title.replace(/[<>:"/\\|?*]/g, "_")}.txt`);
  res.type("text/plain; charset=utf-8");
  const sections = books.studySections(book);
  await pipeline(Readable.from((async function* () {
    try {
      yield `${book.title}\n\n`;
      for await (const section of sections) {
        yield `${section.text}\n`;
        if (section.image?.url) yield `[Figure: ${section.image.altText}] ${section.image.url}\n`;
        yield "\n";
      }
    } finally {
      await sections.close();
    }
  })()), res);
}));

function respond(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error instanceof multer.MulterError ? 400 : error.statusCode || 500;
  if (status >= 500) console.error("Tocho request failed:", error.name);
  return res.status(status).json({ message: status >= 500 ? "Tocho is temporarily unavailable." :
    error instanceof multer.MulterError ? "Could not read the upload part. Try again." : error.message });
}
admin.use(respond);
notes.use(respond);
module.exports = { admin, notes };
