import { addProduct, adminSignin, multiple } from "../controller/admin_controller.js"; // Include the .js extension


export const adminRoute = (router) => {

    router.post("/admin/signin", adminSignin);

    router.post("/admin/addProduct", multiple, addProduct);

}
