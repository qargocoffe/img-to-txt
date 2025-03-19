const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "/tmp/uploads/" });

app.use(cors({ origin: "*" }));

const initializeWorker = async () => {
    const worker = await createWorker("eng");
    return worker;
};

let workerPromise = initializeWorker();

app.post("/ocr", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const imagePath = req.file.path;
        const { data } = await (await workerPromise).recognize(imagePath);

        const formattedText = data.text
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
