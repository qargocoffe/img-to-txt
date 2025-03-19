const express = require("express");
const multer = require("multer");
const getWorker = require("tesseract.js-node");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "/tmp/" });

app.use(cors({ origin: "*" }));

// Initialize Tesseract.js worker
let worker;

const initializeWorker = async () => {
    worker = await getWorker({
        tessdata: "/tmp/tessdata", // Make sure tessdata is available
        languages: ["eng"], // Add more languages if needed
    });
};

// Ensure the worker is initialized before handling requests
initializeWorker().catch(console.error);

app.post("/ocr", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const imagePath = req.file.path;
        const text = await worker.recognize(imagePath, "eng");

        const formattedText = text
            .replace(/\n+/g, "\n")
            .replace(/(\d+)\s*%/g, "$1%")
            .replace(/(\d+)\s*([a-zA-Z]+)/g, "$1 $2");

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(formattedText);

        fs.unlinkSync(imagePath);
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to process image.");
    }
});

// Export for Vercel
module.exports = app;
