const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Content = require("../models/Content");

// ใช้สำหรับแจ้ง player ให้รีเฟรชเพลย์ลิสต์ (in-memory)
let publishVersion = Date.now();

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี (ป้องกัน error 500 บน server ใหม่)
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === Multer config === //
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// รองรับไฟล์ใหญ่ (เช่น 1080p) สูงสุด ~500MB
exports.uploadFileMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

// === Upload handler === //
exports.uploadContent = async (req, res) => {
  try {
    const { title, duration, playlistName, order } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const type = req.file.mimetype.startsWith("video") ? "video" : "image";

    const newItem = new Content({
      title,
      type,
      url: `/uploads/${req.file.filename}`,
      durationSeconds: duration || 10,
      playlistName: playlistName || "default",
      playlistOrder: order || 0,
    });

    await newItem.save();
    publishVersion = Date.now(); // แจ้งเวอร์ชันใหม่หลังอัปโหลด
    res.json({ message: "Uploaded successfully", data: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload error" });
  }
};

// === Get all === //
exports.getAllContents = async (_req, res) => {
  try {
    const items = await Content.find().sort({ playlistOrder: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching contents" });
  }
};

// === Update (order, playlistName, duration, title) === //
exports.updateContent = async (req, res) => {
  try {
    const { playlistOrder, playlistName, durationSeconds, title } = req.body;

    const update = {};
    if (playlistOrder !== undefined) update.playlistOrder = Number(playlistOrder);
    if (playlistName !== undefined) update.playlistName = playlistName;
    if (durationSeconds !== undefined) update.durationSeconds = Number(durationSeconds);
    if (title !== undefined) update.title = title;

    const item = await Content.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }

    publishVersion = Date.now();
    res.json({ message: "Updated", data: item });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// === Bulk reorder playlistOrder === //
exports.reorderContents = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to reorder" });
    }

    const ops = items
      .filter((it) => it && it.id && Number.isFinite(Number(it.order)))
      .map((it) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(it.id) },
          update: { $set: { playlistOrder: Number(it.order) } },
        },
      }));

    if (ops.length === 0) {
      return res.status(400).json({ message: "No valid items to update" });
    }

    await Content.bulkWrite(ops);
    publishVersion = Date.now();
    res.json({ message: "Reordered", updated: ops.length });
  } catch (err) {
    console.error("Reorder error:", err);
    res.status(500).json({ message: "Reorder failed" });
  }
};

// === Delete === //
exports.deleteContent = async (req, res) => {
  try {
    const item = await Content.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Content not found" });
    }

    publishVersion = Date.now(); // แจ้งเวอร์ชันใหม่หลังลบ
    res.json({ message: "Content deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// === Publish signal === //
exports.triggerPublish = async (_req, res) => {
  publishVersion = Date.now();
  res.json({ message: "Publish signal sent", version: publishVersion });
};

exports.getPublishVersion = async (_req, res) => {
  res.json({ version: publishVersion });
};
