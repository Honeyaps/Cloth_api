import mongoose from "mongoose";

const addProductSchema = new mongoose.Schema(
    {
        productName: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true },
        insert_date_time: { type: Date, default: Date.now },
        update_date_time: { type: Date },
    },
    {
        collection: "addProduct_admin",
    }
);
const addProducts = mongoose.model("addProduct_admin", addProductSchema);

export default addProducts;