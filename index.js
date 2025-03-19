const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 4000;
const upload = multer({ dest: path.join(__dirname, "uploads/") });

app.use(cors({ origin: "*" }));
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize worker globally
let worker;
(async () => {
    worker = await createWorker("eng");
})();

app.post("/ocr", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const imagePath = req.file.path;

        if (!worker) {
            return res.status(500).send("Tesseract worker is not ready.");
        }

        const { data } = await worker.recognize(imagePath);

        const formattedText = data.text
            .replace(/\n+/g, "\n")
            .replace(/(\d+)\s*%/g, "$1%")
            .replace(/(\d+)\s*([a-zA-Z]+)/g, "$1 $2");

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(formattedText);

        // Cleanup
        fs.unlinkSync(imagePath);
    } catch (error) {
        console.error("OCR Processing Error:", error);
        res.status(500).send("Failed to process image.");
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
