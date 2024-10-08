import { AddProductValidate, adminSigninValidate, getDashboardInsightsValidate, UpdateProductValidate } from "../../config/helpers/validators.js";
import { Auth } from "../../lib/jwt.js";
import validateRequest from "../../config/helpers/validateRequest.js";
import { addProduct, adminSignin, getDashboardInsights, updateProduct } from "../controller/admin_controller.js"; // Include the .js extension
import { multiple } from "../models/users_model.js";


export const adminRoute = (router) => {

    router.post("/admin/signin", validateRequest(adminSigninValidate), adminSignin);

    router.post("/admin/addProduct", Auth, validateRequest(AddProductValidate), multiple, addProduct);

    router.post("/admin/updateProduct", Auth, validateRequest(UpdateProductValidate), multiple, updateProduct);

    router.post("/admin/getDashboardInsights", validateRequest(getDashboardInsightsValidate), getDashboardInsights);

}
