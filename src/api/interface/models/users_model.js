import cloudinary from "../../config/cloudinary.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";
import multer from "multer";
import streamifier from "streamifier";

// Setup multer for image upload
const upload = multer({ storage: multer.memoryStorage() });
export let multiple = upload.fields([
  { name: 'card_pic', maxCount: 1 },
  { name: 'images', maxCount: 4 }  
]);

const uploadSingleImage = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  } catch (error) {
    console.error("UploadSingleImage error:", error);
    throw error;
  }
};

export async function uploadImages(files, productId) {

  try {

    const uploadPromises = [];

    let cardPicUrl = null;

    if (files.card_pic?.[0]) {
      const cardUpload = uploadSingleImage(files.card_pic[0]);
      uploadPromises.push(cardUpload);
    }

    const imageFiles = files.images || [];

    const imageUploads = imageFiles.map(file => uploadSingleImage(file));

    uploadPromises.push(...imageUploads);

    const results = await Promise.all(uploadPromises);

    if (files.card_pic?.[0]) {
      cardPicUrl = results.shift();
    }

    const updatedProduct = await addProducts.findByIdAndUpdate(
      productId,
      {
        card_pic: cardPicUrl,
        images: results
      },
      { new: true }
    );

    return updatedProduct;

  } catch (error) {

    console.error("Upload images error:", error);

    throw new Error("Failed to upload product images");
  }
}



export async function uploadUpdatedImages(files, existingProduct) {
  try {

    const reqData = {};

    // Update card image
    if (files?.card_pic && files.card_pic.length > 0) {

      const cardPicFile = files.card_pic[0];

      const cardPicUrl = await uploadSingleImage(cardPicFile);

      reqData.card_pic = cardPicUrl;

    }

    // Update gallery images
    if (files?.images && files.images.length > 0) {

      const imageUploads = files.images.slice(0,4).map(file =>
        uploadSingleImage(file)
      );

      const imageUrls = await Promise.all(imageUploads);

      reqData.images = imageUrls;

    }

    // Update DB if images exist
    if (Object.keys(reqData).length > 0) {

      await addProducts.updateOne(
        { _id: existingProduct._id },
        { $set: reqData }
      );

    }

    console.log("Images updated successfully for product:", existingProduct._id);

  } catch (error) {
    console.error("Error in image upload process:", error);
  }
}

