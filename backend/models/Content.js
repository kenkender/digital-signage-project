const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "video"],   // ❌ ลบ youtube ออก
      required: true
    },
    url: { type: String, required: true },
    durationSeconds: { type: Number, default: 10 },
    playlistName: { type: String, default: "default" },
    playlistOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);
