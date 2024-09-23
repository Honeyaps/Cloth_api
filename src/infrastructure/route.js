import express from "express";
import { UserRoute } from "../api/interface/routes/user.js";

/** crate global router */
export const createRouter = () => {
  const router = express.Router();

  UserRoute(router);

  return router;
};
