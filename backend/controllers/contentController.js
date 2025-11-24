const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Content = require("../models/Content");

// publish version แยกตาม tenant
const publishVersions = {};

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

exports.uploadFileMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

// helper เลือก tenantId
function resolveTenantId(req, source = "body") {
  // admin อนุญาตเลือก tenant จาก query/body
  if (req.user && req.user.role === "admin") {
    if (source === "body" && req.body.tenantId) return req.body.tenantId;
    if (source === "query" && req.query.tenantId) return req.query.tenantId;
  }
  // user ปกติใช้ username เป็น tenantId
  if (req.user && req.user.username) return req.user.username;
  // สำหรับ player/public GET
  if (source === "query" && req.query.tenantId) return req.query.tenantId;
  return null;
}

// Upload
exports.uploadContent = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req, "body");
    if (!tenantId) return res.status(400).json({ message: "Missing tenantId" });

    const { title, duration, playlistName, order } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const type = req.file.mimetype.startsWith("video") ? "video" : "image";

    const newItem = new Content({
      title,
      type,
      url: `/uploads/${req.file.filename}`,
      durationSeconds: duration || 10,
      playlistName: playlistName || "default",
      playlistOrder: order || 0,
      tenantId,
    });

    await newItem.save();
    publishVersions[tenantId] = Date.now();
    res.json({ message: "Uploaded successfully", data: newItem });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload error" });
  }
};

// Get all (support public GET with tenantId query)
exports.getAllContents = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req, "query");
    if (!tenantId) {
      return res
        .status(400)
        .json({ message: "tenantId required (query or token)" });
    }

    const items = await Content.find({ tenantId }).sort({ playlistOrder: 1 });
    res.json(items);
  } catch (err) {
    console.error("Error fetching contents:", err);
    res.status(500).json({
      message: "Error fetching contents",
      detail: err?.message || "unknown",
    });
  }
};

// Update item (auth required)
exports.updateContent = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req, "body") || resolveTenantId(req, "query");
    if (!tenantId) return res.status(401).json({ message: "Unauthorized" });

    const { playlistOrder, playlistName, durationSeconds, title } = req.body;

    const update = {};
    if (playlistOrder !== undefined) update.playlistOrder = Number(playlistOrder);
    if (playlistName !== undefined) update.playlistName = playlistName;
    if (durationSeconds !== undefined) update.durationSeconds = Number(durationSeconds);
    if (title !== undefined) update.title = title;

    const item = await Content.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      update,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Content not found" });

    publishVersions[tenantId] = Date.now();
    res.json({ message: "Updated", data: item });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

// Bulk reorder
exports.reorderContents = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req, "body");
    if (!tenantId) return res.status(401).json({ message: "Unauthorized" });

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items to reorder" });
    }

    const ops = items
      .filter(
        (it) =>
          it &&
          it.id &&
          Number.isFinite(Number(it.order)) &&
          (!it.tenantId || it.tenantId === tenantId)
      )
      .map((it) => ({
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(it.id),
            tenantId,
          },
          update: { $set: { playlistOrder: Number(it.order) } },
        },
      }));

    if (ops.length === 0) {
      return res.status(400).json({ message: "No valid items to update" });
    }

    await Content.bulkWrite(ops);
    publishVersions[tenantId] = Date.now();
    res.json({ message: "Reordered", updated: ops.length });
  } catch (err) {
    console.error("Reorder error:", err);
    res.status(500).json({ message: "Reorder failed" });
  }
};

// Delete
exports.deleteContent = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req, "query");
    if (!tenantId) return res.status(401).json({ message: "Unauthorized" });

    const item = await Content.findOneAndDelete({
      _id: req.params.id,
      tenantId,
    });

    if (!item) return res.status(404).json({ message: "Content not found" });

    publishVersions[tenantId] = Date.now();
    res.json({ message: "Content deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// Publish signal
exports.triggerPublish = async (req, res) => {
  const tenantId =
    resolveTenantId(req, "body") || resolveTenantId(req, "query");
  if (!tenantId) return res.status(400).json({ message: "Missing tenantId" });

  publishVersions[tenantId] = Date.now();
  res.json({ message: "Publish signal sent", version: publishVersions[tenantId] });
};

exports.getPublishVersion = async (req, res) => {
  const tenantId = resolveTenantId(req, "query");
  if (!tenantId) return res.status(400).json({ message: "Missing tenantId" });
  res.json({ version: publishVersions[tenantId] || 0 });
};
