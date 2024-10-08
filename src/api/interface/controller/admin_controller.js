import jwt from "jsonwebtoken";
import moment from "moment";
import env from "../../../infrastructure/env.js";
import { ErrorResponse, SuccessResponse } from "../../config/helpers/apiResponse.js";
import addProducts from "../../config/schema/adminAddProduct.schema.js";
import order from "../../config/schema/order.schema.js";
import userSignup from "../../config/schema/userSignup.schema.js";
import { uploadImages, uploadUpdatedImages } from "../models/users_model.js";

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
    // Step 1: Prepare the product data
    const reqData = {
      productName: req.body.productName,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      quantity: req.body.quantity,  
      card_pic: null,
      images: [], 
      insert_date_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      update_date_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    // Step 2: Save the product in MongoDB
    const newProduct = new addProducts(reqData);
    const savedProduct = await newProduct.save();

    console.log("Product saved:", savedProduct); // Log saved product

    await uploadImages(req.files, savedProduct._id);

    const updatedProduct = await addProducts.findById(savedProduct._id);
     SuccessResponse(res, "Product added successfully with images", updatedProduct);

  } catch (error) {
    console.error("Error in addProduct:", error);
    return ErrorResponse(res, "An error occurred while adding the product.");
  }
};



export const updateProduct = async (req, res) => {
  try {
    const { id } = req.body;

    const existingProduct = await addProducts.findById(id);
    if (!existingProduct) {
      return ErrorResponse(res, "Product not found.");
    }

    const reqData = {
      productName: req.body.productName || existingProduct.productName,
      description: req.body.description || existingProduct.description,
      price: req.body.price || existingProduct.price,
      category: req.body.category || existingProduct.category,
      quantity: req.body.quantity || existingProduct.quantity,
      card_pic: existingProduct.card_pic, 
      images: existingProduct.images,
      update_date_time: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    await addProducts.updateOne({ _id: id }, { $set: reqData });
    SuccessResponse(res, "Product updated successfully, image updates in progress", { id, ...reqData });
    await uploadUpdatedImages(req.files, existingProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return ErrorResponse(res, "An error occurred while updating the product. Please try again later.");
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
    
