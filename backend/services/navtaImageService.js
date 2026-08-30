const cloudinary =
  require("../config/cloudinary");

// =====================================================
// UPLOAD QUESTION DIAGRAM
// =====================================================

const uploadQuestionImage = async ({
  buffer,
  fileName = "question-diagram",
  folder = "navta/question-diagrams",
}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "A valid image buffer is required."
    );
  }

  if (buffer.length === 0) {
    throw new Error(
      "The image buffer is empty."
    );
  }

  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder,

            resource_type:
              "image",

            use_filename:
              true,

            unique_filename:
              true,

            overwrite:
              false,

            context: {
              originalFileName:
                fileName,
            },
          },

          (error, result) => {
            if (error) {
              console.error(
                "CLOUDINARY UPLOAD ERROR:",
                error
              );

              return reject(
                error
              );
            }

            return resolve({
              url:
                result.secure_url ||
                "",

              publicId:
                result.public_id ||
                "",

              width:
                result.width,

              height:
                result.height,
            });
          }
        );

      stream.end(buffer);
    }
  );
};

// =====================================================
// DELETE QUESTION DIAGRAM
// =====================================================

const deleteQuestionImage =
  async (publicId) => {
    if (!publicId) {
      return null;
    }

    return cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "image",
      }
    );
  };

// =====================================================
// CHECK CLOUDINARY CONNECTION
// =====================================================

const verifyCloudinaryConnection =
  async () => {
    const result =
      await cloudinary.api.ping();

    return result;
  };

module.exports = {
  uploadQuestionImage,
  deleteQuestionImage,
  verifyCloudinaryConnection,
};
