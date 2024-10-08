
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../config/db.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";
import multer from "multer";

// Setup multer for image upload
const upload = multer({ storage: multer.memoryStorage() });
export let multiple = upload.fields([
  { name: 'card_pic', maxCount: 1 },
  { name: 'images', maxCount: 4 }  
]);

const uploadSingleImage = async (file, path) => {
    try {
        const storageRef = ref(storage, `${path}/${Date.now()}_${file.originalname}`);
        const metadata = { contentType: file.mimetype };
        
        const uploadSnapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);
        const downloadURL = await getDownloadURL(uploadSnapshot.ref);
        
        // Log the URL of the uploaded image
        console.log(`Uploaded ${file.originalname} to ${path}. Download URL: ${downloadURL}`);
        
        return downloadURL;
    } catch (error) {
        console.error(`Error uploading image ${file.originalname}:`, error);
        throw new Error(`Failed to upload image ${file.originalname}`);
    }
};

export async function uploadImages(files, productId) {
    try {
        const cardPicUrl = files.card_pic?.[0]
            ? await uploadSingleImage(files.card_pic[0], 'product_card_img')
            : null;

        const imageFiles = files.images || [];
        const imageUrls = await Promise.all(
            imageFiles.slice(0, 4).map(file => uploadSingleImage(file, 'product_img'))
        );

        // Log URLs for debugging
        console.log("Card Pic URL:", cardPicUrl);
        console.log("Image URLs:", imageUrls);

        // Update the MongoDB document with URLs
        await addProducts.findByIdAndUpdate(productId, { card_pic: cardPicUrl, images: imageUrls });

        console.log("Images uploaded and product updated successfully");
    } catch (error) {
        console.error("Error uploading images:", error);
        throw new Error("Failed to upload images and update the product.");
    }
}


export async function uploadUpdatedImages(files, existingProduct) {
    try {
        const reqData = {};

        if (files?.card_pic && files.card_pic.length > 0) {
          const cardPicFile = files.card_pic[0];
          const storageRef = ref(storage, `product_card_img/${Date.now()}_${cardPicFile.originalname}`);
          const metadata = { contentType: cardPicFile.mimetype };
          const uploadSnapshot = await uploadBytesResumable(storageRef, cardPicFile.buffer, metadata);
          reqData.card_pic = await getDownloadURL(uploadSnapshot.ref);
    
          if (existingProduct.card_pic) {
            const existingCardPicRef = ref(storage, existingProduct.card_pic);
            await deleteObject(existingCardPicRef);
          }
        }

        if (files?.images && files.images.length > 0) {
          if (existingProduct.images.length > 0) {
            const existingImageRefs = existingProduct.images.map(image => ref(storage, image));
            await Promise.all(existingImageRefs.map(ref => deleteObject(ref)));
          }
          const uploadPromises = files.images.slice(0, 4).map(async (imageFile) => {
            const storageRef = ref(storage, `product_img/${Date.now()}_${imageFile.originalname}`);
            const metadata = { contentType: imageFile.mimetype };
            const uploadSnapshot = await uploadBytesResumable(storageRef, imageFile.buffer, metadata);
            return await getDownloadURL(uploadSnapshot.ref);
          });
          reqData.images = await Promise.all(uploadPromises);
        }
        
        if (Object.keys(reqData).length > 0) {
          await addProducts.updateOne({ _id: existingProduct._id }, { $set: reqData });
        }
        console.log("Images updated successfully for product:", existingProduct._id);
      } catch (error) {
        console.error("Error in image upload process:", error);
      }
}

