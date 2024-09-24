import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String },
    insert_date_time: { type: Date, default: Date.now },
    address: { type: String, required: true },
    mobileno: { type: String, required: true },
    userDetails: {
      type: Object,
      required: true
    },
    productDetails: { 
      type: Object,
      required: true
    }
  },
  {
    collection: "orders",
  }
);

const order = mongoose.model("orders", orderSchema);
export default order;
