const express = require("express");
const router = express.Router();
const {
  issueControl,
  getControlState,
  clearControl,
} = require("../controllers/controlController");

router.post("/control", issueControl); // ส่งคำสั่ง
router.get("/control/state", getControlState); // player poll
router.post("/control/clear", clearControl); // ล้างคำสั่ง

module.exports = router;
