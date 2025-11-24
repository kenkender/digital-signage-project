const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
// รองรับทั้ง MONGO_URI และ MONGODB_URI (เช่น Render/Atlas)
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://mongodb:27017/digital_signage";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.json({ status: "ok", api: "/api", mongo: !!MONGO_URI });
});

const routes = require("./routes/contentRoutes");
const controlRoutes = require("./routes/controlRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);
app.use("/api", routes);
app.use("/api", controlRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error", err);
    console.error("Using MONGO_URI:", MONGO_URI);
  });

app.listen(PORT, HOST, () =>
  console.log(`Server running on http://${HOST}:${PORT}`)
);
