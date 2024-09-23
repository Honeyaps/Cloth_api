import multer from "multer";
import jwt from "jsonwebtoken";
import env from "../../../infrastructure/env.js";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../config/db.js";
import moment from "moment";
import { ErrorResponse, SuccessResponse } from "../../config/helpers/apiResponse.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";

// Setup multer for image upload
const upload = multer({ storage: multer.memoryStorage() });
export let multiple = [upload.single("image")];

export const adminSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isEmailValid = email === env.ADMIN_EMAIL;
    const isPasswordValid = password === env.ADMIN_PASS;

    if (isEmailValid && isPasswordValid) {
      const token = jwt.sign({ id: 'admin' }, env.JWT_SECRET, { expiresIn: '2d' });
      return SuccessResponse(res, "Admin logged in successfully", { token });
    } else {
      return ErrorResponse(res, "Invalid email or password");
    }
  } catch (error) {
    return ErrorResponse(res, "An error occurred while logging in. Please try again later.");
  }
};

export const addProduct = async (req, res) => {
  try {
    const { id } = req.body;
    const reqData = {
      productName: req.body.productName,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      quantity: req.body.quantity,
      image: req.file?.path,
      update_date_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    let existingImageUrl = null;

    if (id) {
      const existingProduct = await addProducts.findById(id);
      if (existingProduct) {
        existingImageUrl = existingProduct.image;
      }
    }

    if (req.file) {
      const dataTime = Date.now();
      const storageRef = ref(
        storage,
        `product_img/${req.file.originalname + " " + dataTime}`
      );
      const metadata = {
        contentType: req.file.mimetype,
      };
      const snapshot = await uploadBytesResumable(
        storageRef,
        req.file.buffer,
        metadata
      );
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (existingImageUrl) {
        const existingImageRef = ref(storage, existingImageUrl);
        await deleteObject(existingImageRef); 
      }

      reqData.image = downloadURL; 
    } else if (existingImageUrl) {
      reqData.image = existingImageUrl; 
    }

    if (id) {
      // Update existing product
      await addProducts.updateOne({ _id: id }, { $set: reqData });
      return SuccessResponse(res, "Product updated successfully", { id, ...reqData });
    } else {
      // Add new product
      const newProduct = new addProducts({
        ...reqData,
        insert_date_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      const savedProduct = await newProduct.save();
      return SuccessResponse(res, "Product added successfully", { ...savedProduct.toObject() });
    }
  } catch (error) {
    console.error(error); 
    return ErrorResponse(res, "An error occurred while adding product. Please try again later.");
  }
};

    
