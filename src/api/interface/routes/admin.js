import { getDashboardInsightsValidate } from "../../config/helpers/validators.js";
import { Auth } from "../../lib/jwt.js";
import validateRequest from "../../config/helpers/validateRequest.js";
import { addProduct, adminSignin, getDashboardInsights, multiple } from "../controller/admin_controller.js"; // Include the .js extension


export const adminRoute = (router) => {

    router.post("/admin/signin",validateRequest(getDashboardInsightsValidate), adminSignin);

    router.post("/admin/addProduct", Auth, multiple, addProduct);

    router.post("/admin/getDashboardInsights",validateRequest(getDashboardInsightsValidate), getDashboardInsights);

}
