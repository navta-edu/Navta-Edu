const express = require("express");

const router = express.Router();

const {
  saveMistake,
  getMistakes,
  getMistakeById,
  updateNote,
  updateMastered,
  recordReview,
  deleteMistake,
  getMistakeStats,
} = require("../controllers/mistakeNotebookController");

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
|
| Add the SAME authentication middleware here that your other
| student-protected backend routes use.
|
| These routes depend on req.user.
|
*/

/*
|--------------------------------------------------------------------------
| Mistake Notebook Routes
|--------------------------------------------------------------------------
*/

router.post("/", saveMistake);

router.get("/", getMistakes);

/*
 * Keep /stats BEFORE /:id.
 * Otherwise Express could interpret "stats" as an ID.
 */
router.get("/stats", getMistakeStats);

router.get("/:id", getMistakeById);

router.put("/:id/note", updateNote);

router.put("/:id/mastered", updateMastered);

router.put("/:id/review", recordReview);

router.delete("/:id", deleteMistake);

module.exports = router;
