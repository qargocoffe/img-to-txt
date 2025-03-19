const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js-node"); // Use Node.js optimized version
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "/tmp/" }); // Vercel allows writing only to /tmp

app.use(cors({ origin: "*" }));

// Pre-initialize Tesseract worker
let worker = null;
const initializeWorker = async () => {
    if (!worker) {
        worker = await Tesseract.createWorker("eng");
    }
    return worker;
};
initializeWorker(); // Start worker initialization

app.post("/ocr", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const imagePath = req.file.path;
        console.log("Processing image:", imagePath);

        const workerInstance = await initializeWorker();
        const { data } = await workerInstance.recognize(imagePath);

        // Format extracted text
        const formattedText = data.text
            .replace(/\n+/g, "\n")
            .replace(/(\d+)\s*%/g, "$1%")
            .replace(/(\d+)\s*([a-zA-Z]+)/g, "$1 $2");

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(formattedText);

        // Clean up temp file
        fs.unlinkSync(imagePath);
    } catch (error) {
        console.error("OCR Processing Error:", error);
        res.status(500).json({ error: "Failed to process image." });
    }
});

// Export for Vercel
module.exports = app;
