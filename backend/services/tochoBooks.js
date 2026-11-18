const { ObjectId } = require("mongoose").mongo;
const mongoose = require("mongoose");
const { createHash, randomUUID } = require("node:crypto");
const { setImmediate: yieldToServer } = require("node:timers/promises");
const NavtaQuestion = require("../models/NavtaQuestion");
const Note = require("../models/Note");
const { openBook, scanUnit, matchBookSolutions } = require("./tochoScan");

const chunkBytes = 4 * 1024 * 1024;
const maxBytes = 250 * 1024 * 1024;
const leaseMs = 90 * 1000;
const jobs = () => mongoose.connection.db.collection("tochoJobs");
const chunks = () => mongoose.connection.db.collection("tochoChunks");
const units = () => mongoose.connection.db.collection("tochoUnits");
const digest = value => createHash("sha256").update(value).digest("hex");
const unitId = (book, number) => `${book}:${String(number).padStart(10, "0")}`;
const questionId = (book, entry) => new ObjectId(digest(`${book}:${entry.unit}:${entry.index}`).slice(0, 24));
const projection = { owner: 0, fingerprint: 0, lease: 0, scope: 0 };
let running = false;
let indexes;

async function initializeStore() {
  indexes ||= Promise.all([
    jobs().createIndex({ owner: 1, createdAt: -1 }),
    chunks().createIndex({ book: 1, number: 1 }),
    units().createIndex({ book: 1, number: 1 }),
  ]).catch(error => { indexes = null; throw error; });
  await indexes;
}

function failure(status, message) {
  return Object.assign(new Error(message), { statusCode: status });
}

function asId(id) {
  if (typeof id !== "string" || !/^[0-9a-f]{24}$/i.test(id)) throw failure(400, "Invalid Tocho book ID.");
  return new ObjectId(id);
}

async function ownedJob(id, owner) {
  const job = await jobs().findOne({ _id: asId(id), owner });
  if (!job) throw failure(404, "Book import not found.");
  return job;
}

async function createJob({ owner, fileName, title, size, fingerprint, hints }) {
  await initializeStore();
  const id = new ObjectId(digest(JSON.stringify([String(owner), title, fileName, size, fingerprint])).slice(0, 24));
  const createdAt = new Date();
  await jobs().updateOne({ _id: id }, {
    $setOnInsert: {
      owner, fileName, title, size, fingerprint, hints, format: fileName.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
      partCount: Math.ceil(size / chunkBytes), status: "uploading", scanned: 0, createdAt, updatedAt: createdAt,
    }
  }, { upsert: true });
  return getJob(id.toString(), owner);
}

async function getJob(id, owner) {
  const job = await jobs().findOne({ _id: asId(id), owner }, { projection });
  if (!job) throw failure(404, "Book import not found.");
  if (job.status === "uploading") {
    job.uploadedParts = await chunks().find({ book: job._id }).sort({ number: 1 }).project({ _id: 0, number: 1 }).map(part => part.number).toArray();
  }
  return job;
}

async function listJobs(owner) {
  return jobs().find({ owner }, { projection }).sort({ createdAt: -1 }).limit(25).toArray();
}

async function saveChunk(id, owner, number, buffer) {
  const job = await ownedJob(id, owner);
  if (!Number.isInteger(number) || number < 0 || number >= job.partCount) throw failure(400, "Invalid upload part.");
  if (job.status !== "uploading") throw failure(409, "This book has finished uploading.");
  const expected = Math.min(chunkBytes, job.size - number * chunkBytes);
  if (!buffer || buffer.length !== expected) throw failure(400, "The upload part has an incorrect size. Retry the upload.");
  if (number === 0) {
    const header = buffer.subarray(0, 5).toString("ascii");
    if (job.format === "pdf" ? header !== "%PDF-" : buffer.readUInt32LE(0) !== 0x04034b50) {
      throw failure(400, "The file does not match its PDF or DOCX format.");
    }
  }
  const chunkHash = digest(buffer);
  const partId = `${job._id}:${number}`;
  const saved = await chunks().findOneAndUpdate({ _id: partId }, {
    $setOnInsert: { book: job._id, number, chunkHash, data: buffer },
  }, { upsert: true, returnDocument: "after", projection: { chunkHash: 1 } });
  if (saved?.chunkHash !== chunkHash) throw failure(409, "This file differs from the previous upload. Start a new book import.");
}

async function setProgress(book, lease, updates) {
  const saved = await jobs().updateOne({ _id: book, lease }, {
    $set: { ...updates, updatedAt: new Date(), leaseUntil: new Date(Date.now() + leaseMs) },
  });
  if (!saved.matchedCount) throw new Error("The book import lease expired.");
}

async function assemble(job) {
  const buffer = Buffer.alloc(job.size);
  const fingerprint = createHash("sha256");
  let expected = 0;
  for await (const part of chunks().find({ book: job._id }, { promoteBuffers: true }).sort({ number: 1 })) {
    if (part.number !== expected) throw new Error("The book upload is missing a part.");
    part.data.copy(buffer, expected * chunkBytes);
    fingerprint.update(Buffer.from(digest(part.data), "hex"));
    expected++;
  }
  if (expected !== job.partCount) throw new Error("The book upload is incomplete.");
  if (fingerprint.digest("hex") !== job.fingerprint) throw new Error("The uploaded book did not match the selected file. Start a new upload.");
  return buffer;
}

async function scanBook(job, lease) {
  if (job.scannedAll) return;
  const book = await openBook(await assemble(job), job.format);
  try {
    await setProgress(job._id, lease, { status: "scanning", total: book.total });
    let scope = job.scope || "";
    for (let number = job.scanned + 1; number <= book.total; number++) {
      const id = unitId(job._id, number);
      const saved = await units().findOne({ _id: id }, { projection: { scope: 1 } });
      if (saved) {
        scope = saved.scope;
      } else {
        await yieldToServer();
        const result = await scanUnit(await book.read(number), job.hints, scope, id.replace(":", "-"));
        await setProgress(job._id, lease, { status: "scanning" });
        scope = result.scope;
        await units().insertOne({
          _id: id, book: job._id, number, scope,
          items: result.items.map((item, index) => ({ ...item, _id: `${id}:${index}`, unit: number, index })),
        });
      }
      await setProgress(job._id, lease, { scanned: number, scope });
    }
    await setProgress(job._id, lease, { scannedAll: true, status: "routing" });
  } finally {
    await book.close();
  }
}

function questionDraft(job, item, solution) {
  const isMcq = item.classification.questionType === "mcq";
  const answerIndex = solution?.answerChoice ? "ABCD".indexOf(solution.answerChoice) : -1;
  const solutionText = solution?.text || "";
  return {
    ...item.classification,
    question: item.text,
    workflowStatus: "draft",
    isActive: false,
    questionImage: item.image,
    questionImages: item.image ? [item.image] : [],
    correctAnswer: isMcq && answerIndex >= 0 ? answerIndex : undefined,
    modelAnswer: isMcq ? "" : solutionText,
    explanation: isMcq ? solutionText : "",
    questionNumber: item.number,
    sourceDocument: {
      bookImport: job._id, fileName: job.fileName, fileType: job.format, importedByAI: true,
      pageNumber: job.format === "pdf" ? item.unit : undefined, solutionUnit: solution?.unit,
    },
  };
}

async function routeBook(job, lease) {
  const references = [];
  for await (const unit of units().find({ book: job._id }).sort({ number: 1 })) {
    for (const item of unit.items) {
      if (["question", "solution"].includes(item.kind)) references.push({
        _id: item._id, number: item.number, kind: item.kind, scope: item.scope, unit: item.unit, index: item.index,
      });
    }
  }
  const { matches, used } = matchBookSolutions(references);
  let questionCount = 0;
  let matchedCount = 0;
  let notesCount = 0;
  let reviewCount = 0;
  for await (const unit of units().find({ book: job._id }).sort({ number: 1 })) {
    for (const item of unit.items) {
      if (item.kind === "study") {
        notesCount++;
      } else if (item.kind === "question" && item.classification) {
        const ref = matches.get(item._id);
        let solution;
        if (ref) {
          const source = await units().findOne({ _id: unitId(job._id, ref.unit) });
          solution = source?.items[ref.index];
        }
        const id = questionId(job._id, item);
        const draft = new NavtaQuestion({ _id: id, ...questionDraft(job, item, solution) });
        await draft.validate();
        await NavtaQuestion.collection.updateOne({ _id: id }, {
          $setOnInsert: { ...draft.toObject(), createdAt: new Date(), updatedAt: new Date(), __v: 0 },
        }, { upsert: true });
        questionCount++;
        if (solution) matchedCount++;
        if (item.warning || !solution || (item.classification.questionType === "mcq" && !solution.answerChoice)) reviewCount++;
      } else if (item.kind === "review" || item.kind === "question" || (item.kind === "solution" && !used.has(item._id))) {
        reviewCount++;
      }
    }
    if (unit.number % 20 === 0) await setProgress(job._id, lease, { status: "routing" });
  }
  if (notesCount) {
    const note = new Note({
      _id: job._id, tochoBook: true, title: job.title, uploadedBy: job.owner,
      content: "Study sections extracted by Tocho.", subjectName: job.hints.subject,
      className: job.hints.classLevel, exam: job.hints.exam,
    });
    await note.validate();
    await Note.collection.updateOne({ _id: job._id }, { $setOnInsert: note.toObject() }, { upsert: true });
  }
  await setProgress(job._id, lease, { status: "complete", questionCount, matchedCount, notesCount, reviewCount, completedAt: new Date() });
  await chunks().deleteMany({ book: job._id }).catch(error => console.error("Tocho upload cleanup failed:", error.name));
}

async function startJob(id, owner) {
  const job = await ownedJob(id, owner);
  if (job.status === "complete") return;
  if (running) throw failure(409, "Tocho is scanning another book. Try again when it finishes.");
  running = true;
  const lease = randomUUID();
  try {
    if (job.status === "uploading" && await chunks().countDocuments({ book: job._id }) !== job.partCount) {
      throw failure(409, "Finish uploading every part of the book before scanning.");
    }
    const claimed = await jobs().findOneAndUpdate({
      _id: job._id, $or: [
        { status: { $in: ["uploading", "failed"] } },
        { status: { $in: ["scanning", "routing"] }, leaseUntil: { $lte: new Date() } },
      ],
    }, { $set: { status: job.scannedAll ? "routing" : "scanning", lease, error: "", leaseUntil: new Date(Date.now() + leaseMs), updatedAt: new Date() } }, { returnDocument: "after" });
    if (!claimed) throw failure(409, "This book is already being scanned.");
    void (async () => {
      const heartbeat = setInterval(() => {
        jobs().updateOne({ _id: job._id, lease, status: { $in: ["scanning", "routing"] } }, {
          $set: { leaseUntil: new Date(Date.now() + leaseMs) },
        }).catch(error => console.error("Tocho could not refresh a scan lease:", error.name));
      }, 25000);
      heartbeat.unref();
      try {
        await scanBook(claimed, lease);
        await routeBook(claimed, lease);
      } catch (error) {
        console.error("Tocho book import failed:", error.name, error.statusCode || "");
        const message = error.statusCode === 429 ? "AI rate limit reached. Resume the scan later." :
          error.statusCode === 401 || error.statusCode === 403 ? "The AI service denied access. Check the Navta AI configuration." :
          error.statusCode ? "A scan service was unavailable. Resume to retry the unfinished part." :
          String(error.message || "The scan stopped. Resume to retry.").slice(0, 300);
        await jobs().updateOne({ _id: job._id, lease }, { $set: { status: "failed", error: message, updatedAt: new Date() } });
      } finally {
        clearInterval(heartbeat);
        running = false;
      }
    })().catch(error => console.error("Tocho could not record job status:", error.name));
  } catch (error) {
    running = false;
    throw error;
  }
}

async function readReview(id, owner, number) {
  const job = await ownedJob(id, owner);
  const result = await units().findOne({ _id: unitId(job._id, number) });
  return result?.items || [];
}

async function listBooks(page) {
  const filter = { tochoBook: true };
  const [books, total] = await Promise.all([
    Note.find(filter).select("title subjectName className exam createdAt").sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 20).limit(20).lean(),
    Note.countDocuments(filter),
  ]);
  return { books, pages: Math.ceil(total / 20) };
}

async function publishedBook(id) {
  const book = await Note.findOne({ _id: asId(id), tochoBook: true }).select("title").lean();
  if (!book) throw failure(404, "Book notes not found.");
  return book;
}

function studySections(book) {
  return units().aggregate([
    { $match: { book: book._id, "items.kind": "study" } },
    { $sort: { number: 1 } },
    { $unwind: "$items" },
    { $match: { "items.kind": "study" } },
    { $project: { _id: 0, unit: "$number", text: "$items.text", image: "$items.image", scope: "$items.scope" } },
  ]);
}

async function readSections(book, page) {
  return studySections(book).skip((page - 1) * 10).limit(11).toArray();
}

module.exports = { chunkBytes, maxBytes, createJob, getJob, listJobs, saveChunk, startJob, readReview, listBooks, publishedBook, readSections, studySections };
