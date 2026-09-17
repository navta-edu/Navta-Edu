const cloudinary = require("../config/cloudinary");

// =====================================================
// HELPERS
// =====================================================

const cleanFileName = (value = "question-image") =>
  String(value || "question-image")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100) || "question-image";

const cleanFolder = (value = "navta/question-diagrams") =>
  String(value || "navta/question-diagrams")
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "") || "navta/question-diagrams";

// =====================================================
// UPLOAD QUESTION IMAGE
// =====================================================

const uploadQuestionImage = async ({
  buffer,
  fileName = "question-image",
  folder = "navta/question-diagrams",
}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("A valid non-empty image buffer is required.");
  }

  if (!cloudinary?.uploader?.upload_stream) {
    throw new Error("Cloudinary is not configured correctly.");
  }

  const safeFileName = cleanFileName(fileName);
  const safeFolder = cleanFolder(folder);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: safeFolder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: safeFileName,
        context: {
          originalFileName: safeFileName,
        },
      },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY UPLOAD ERROR:", error);

          return reject(
            new Error(
              error?.message ||
                "Cloudinary failed to upload the NAVTA question image."
            )
          );
        }

        if (!result?.secure_url) {
          return reject(
            new Error("Cloudinary upload completed without a secure image URL.")
          );
        }

        return resolve({
          url: result.secure_url,
          publicId: result.public_id || "",
          width: Number(result.width) || null,
          height: Number(result.height) || null,
          format: result.format || "",
          bytes: Number(result.bytes) || null,
        });
      }
    );

    stream.on("error", (error) => {
      reject(
        new Error(
          error?.message || "Cloudinary upload stream failed."
        )
      );
    });

    stream.end(buffer);
  });
};

// =====================================================
// DELETE QUESTION IMAGE
// =====================================================

const deleteQuestionImage = async (publicId) => {
  const safePublicId = String(publicId || "").trim();

  if (!safePublicId) {
    return null;
  }

  if (!cloudinary?.uploader?.destroy) {
    throw new Error("Cloudinary is not configured correctly.");
  }

  return cloudinary.uploader.destroy(safePublicId, {
    resource_type: "image",
    invalidate: true,
  });
};

// =====================================================
// CHECK CLOUDINARY CONNECTION
// =====================================================

const verifyCloudinaryConnection = async () => {
  if (!cloudinary?.api?.ping) {
    throw new Error("Cloudinary is not configured correctly.");
  }

  return cloudinary.api.ping();
};

module.exports = {
  uploadQuestionImage,
  deleteQuestionImage,
  verifyCloudinaryConnection,
};
