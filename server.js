const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { err } = require("console");

mongoose
  .connect("mongodb://localhost:27017/MyFile")
  .then(() => console.log("Connection To MongoDB....."))
  .catch((err) => console.log("Failed Connection!"), err);

const fileSchema = new mongoose.Schema({
  originalName: String,
  filePath: String,
  size: Number,
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model("File", fileSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  const { originalname, filename, size } = req.file;

  // Save file information to MongoDB
  const fileData = new File({
    originalName: originalname,
    filePath: path.join(__dirname, "uploads", filename),
    size,
  });

  await fileData.save();

  res.json(req.file);
});

app.post("/api/multiple-upload", upload.array("files", 4), async (req, res) => {
  const filesData = req.files.map((file) => ({
    originalName: file.originalname,
    filePath: path.join(__dirname, "uploads", file.filename),
    size: file.size,
  }));

  // Save file information to MongoDB
  await File.insertMany(filesData);

  res.json(req.files);
});

app.get("/api/files", async (req, res) => {
  try {
    const files = await File.find({});
    res.json(files);
  } catch (err) {
    console.error("Error reading files from database:", err);
    res.status(500).send("Internal Server Error");
  }
});

const port = 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
