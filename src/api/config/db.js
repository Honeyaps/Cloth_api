import mongoose from "mongoose";
import env from "../../infrastructure/env.js";

let isConnected = false;

export const dbconnection = async () => {
  if (isConnected) {
    return;
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 60000,
    };

    await mongoose.connect(env.MONGO_URL, options);

    isConnected = true;

    console.log("MongoDB Connected Successfully");

    mongoose.set("debug", (collectionName, method, query, doc) => {
      console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
    });

  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
};