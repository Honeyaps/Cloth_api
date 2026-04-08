
import mongoose from "mongoose";
import env from "../../infrastructure/env.js";



// MongoDB connection using mongoose
export const dbconnection = async() => {
  const options = {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 60000, 
  };
  await mongoose
    .connect(env.MONGO_URL, options)
    .then((res) => {
      console.log(`Mongo DB Connected Successfully. ` + env.MONGO_URL);
    })
    .catch((err) => {
      console.error(`Something went wrong in Mongo DB Connection`, err);
    });

  mongoose.set("debug", (collectionName, method, query, doc) => {
    console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
  });
 //  why the last line is not working
  const db = mongoose.connection;
};



