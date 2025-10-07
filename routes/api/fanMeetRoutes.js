const express = require("express");
const router = express.Router();

// Import controllers
const createFanMeetRequest = require("../../Controller/Booking/fanMeetRequest");
const acceptFanMeetRequest = require("../../Controller/Booking/acceptFanMeetRequest");
const declineFanMeetRequest = require("../../Controller/Booking/declineFanMeetRequest");
const cancelFanMeetRequest = require("../../Controller/Booking/cancelFanMeetRequest");
const completeFanMeet = require("../../Controller/Booking/completeFanMeet");
const processExpiredRequests = require("../../Controller/Booking/processExpiredRequests");
const getFanMeetRequests = require("../../Controller/Booking/getFanMeetRequests");

// Create fan meet request
router.post("/create", createFanMeetRequest);

// Accept fan meet request
router.post("/accept", acceptFanMeetRequest);

// Decline fan meet request
router.post("/decline", declineFanMeetRequest);

// Cancel fan meet request
router.post("/cancel", cancelFanMeetRequest);

// Complete fan meet
router.post("/complete", completeFanMeet);

// Get fan meet requests for notifications
router.get("/requests", getFanMeetRequests);

// Process expired requests (cron job endpoint)
router.post("/process-expired", processExpiredRequests);

module.exports = router;
