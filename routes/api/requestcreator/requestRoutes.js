const express = require("express");
const requestRoute = express.Router();
const verifyJwt = require("../../../Middleware/verify");
const isAdmin = require("../../../Middleware/isAdmin");
const {
  acceptCreator,
  getAllCreatorRequests,
  rejectCreator,
} = require("../../../Controller/creatorRequest/creatorActions");
const {
  createUsercreator,
} = require("../../../Controller/creatorRequest/collectCreator");
const upload = require("../../../Middleware/upload");

// Admin actions
requestRoute.get("/all-requests", verifyJwt, isAdmin, getAllCreatorRequests);
requestRoute.put("/accept-creator/:userId", verifyJwt, isAdmin, acceptCreator);
requestRoute.put("/reject-creator/:userId", verifyJwt, isAdmin, rejectCreator);

//sendcreator
requestRoute.post(
  "/register/creator",
  verifyJwt,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  createUsercreator
);
module.exports = requestRoute;
