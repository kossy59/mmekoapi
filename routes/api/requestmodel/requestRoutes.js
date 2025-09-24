const express = require("express");
const requestRoute = express.Router();
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin");
const {
  acceptModel,
  getAllModelRequests,
  rejectModel,
} = require("../../../Controller/modelRequest/modelActions");
const {
  createUsermodel,
} = require("../../../Controller/modelRequest/collectModel");
const upload = require("../../../Middleware/upload");

// Admin actions
requestRoute.get("/all-requests", verifyJwt, isAdmin, getAllModelRequests);
requestRoute.put("/accept-model/:userId", verifyJwt, isAdmin, acceptModel);
requestRoute.put("/reject-model/:userId", verifyJwt, isAdmin, rejectModel);

//sendmodel
requestRoute.post(
  "/register/model",
  verifyJwt,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  createUsermodel
);
module.exports = requestRoute;
