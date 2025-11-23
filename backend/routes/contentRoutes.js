const express = require("express");
const router = express.Router();
const {
  uploadContent,
  uploadFileMiddleware,
  getAllContents,
  deleteContent,
  updateContent,
  triggerPublish,
  getPublishVersion
} = require("../controllers/contentController");

// ดึงทั้งหมด
router.get("/content", getAllContents);

// อัปโหลดรูป/วิดีโอ (จัดการ error จาก multer เพื่อส่งข้อความชัดเจน)
router.post("/content/upload", (req, res, next) => {
  uploadFileMiddleware.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ message: "ไฟล์ใหญ่เกินกำหนด (สูงสุด 500MB สำหรับ 1080p)" });
      }
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    uploadContent(req, res, next);
  });
});

// ลบ content
router.delete("/content/:id", deleteContent);

// อัปเดต content (ใช้สำหรับเปลี่ยนลำดับ/ชื่อ/เวลา)
router.put("/content/:id", updateContent);

// แจ้ง player ให้รีเฟรช
router.post("/publish", triggerPublish);
router.get("/publish/version", getPublishVersion);

module.exports = router;
