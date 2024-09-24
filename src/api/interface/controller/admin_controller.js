import multer from "multer";
import jwt from "jsonwebtoken";
import env from "../../../infrastructure/env.js";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../config/db.js";
import moment from "moment";
import { ErrorResponse, SuccessResponse } from "../../config/helpers/apiResponse.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";
import userSignup from "../../config/schema/userSignup.schema.js";
import order from "../../config/schema/order.schema.js";

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


export const getDashboardInsights = async (req, res) => {
  try {
    const { start_date_time, end_date_time } = req.body; 

    const start = moment(start_date_time).startOf('day').toDate();
    const end = moment(end_date_time).endOf('day').toDate();

    const totalUsers = await userSignup.countDocuments({});

    const activeUsers = await userSignup.countDocuments({ status: 1 });

    const totalOrders = await order.countDocuments({
      insert_date_time: {$gte: start,$lte: end,},
    });

    const totalRevenue = await order.aggregate([
      { $match: {insert_date_time: {$gte: start,$lte: end}}},
      { $unwind: "$productDetails" },
      { $group: { _id: null, total: { $sum: "$productDetails.price"  } } }
    ]);

    const totalProductsSold = await order.aggregate([
      { $match: {insert_date_time: {$gte: start,$lte: end}}},
      { $group: { _id: null, totalSold: { $sum: '$totalQuantity' } } }
    ]);

    const soldOutcategories = await order.aggregate([
      {$match: {insert_date_time: { $gte: start, $lte: end }}},
      {$project: {categoryQuantities: { $objectToArray: "$categoryQuantities" }} },
      {$unwind: "$categoryQuantities"},
      {$group: {_id: "$categoryQuantities.k",total: { $sum: "$categoryQuantities.v" }} }
    ]);
    
    const totalcategorieProducts = await addProducts.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const averageOrderQuantity = totalOrders > 0 ? totalProductsSold[0].totalSold / totalOrders : 0;

    const revenueByCategory = await order.aggregate([
      { $match: { insert_date_time: { $gte: start, $lte: end } } },
      { $unwind: "$productDetails" },
      { $group: { _id: "$productDetails.category", totalRevenue: { $sum: "$productDetails.price" } } }
    ]);
    
    return SuccessResponse(res, "Dashboard insights fetched successfully.", {
      totalUsers,
      activeUsers,
      totalOrders,
      averageOrderQuantity,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      totalProductsSold: totalProductsSold.length > 0 ? totalProductsSold[0].totalSold : 0,
      revenueByCategory,
      soldOutcategories,
      totalcategorieProducts,
    });

  } catch (error) {
    console.error(error);
    return ErrorResponse(res, "An error occurred while fetching the dashboard insights.");
  }
};
    
