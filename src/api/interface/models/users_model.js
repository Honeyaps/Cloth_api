import cloudinary from "../../config/cloudinary.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";
import multer from "multer";

// Setup multer for image upload
const upload = multer({ storage: multer.memoryStorage() });
export let multiple = upload.fields([
  { name: 'card_pic', maxCount: 1 },
  { name: 'images', maxCount: 4 }  
]);

const uploadSingleImage = async (file) => {
    try {
         const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      {
        folder: "products",
      }
    );

    return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Failed to upload image to Cloudinary`);
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

