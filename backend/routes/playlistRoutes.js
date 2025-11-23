const express = require("express");
const router = express.Router();
const Content = require("../models/Content");

// อัปเดต order แบบ bulk
router.post("/playlist/reorder", async (req, res) => {
  try {
    const { items } = req.body; // [{id, order}]
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "items must be an array" });
    }

    const bulk = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { playlistOrder: item.order },
      },
    }));

    if (bulk.length === 0) {
      return res.json({ message: "No items to update" });
    }

    await Content.bulkWrite(bulk);
    res.json({ message: "Reordered successfully" });
  } catch (err) {
    console.error("Reorder error:", err);
    res.status(500).json({ message: "Failed to reorder playlist" });
  }
});

module.exports = router;
