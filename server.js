const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors({ origin: "*" }));

// Initialize Tesseract worker inside an async function
const initializeWorker = async () => {
    const worker = await createWorker("eng");
    return worker;
};

// Start the server after initializing the worker
initializeWorker().then((worker) => {
    app.post("/ocr", upload.single("file"), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).send("No file uploaded.");
            }

            const imagePath = req.file.path;
            const { data } = await worker.recognize(imagePath);

            // Format the extracted text to match the desired output
            const formattedText = data.text
                .replace(/\n+/g, "\n") // Remove extra newlines
                .replace(/(\d+)\s*%/g, "$1%") // Ensure percentages are properly spaced
                .replace(/(\d+)\s*([a-zA-Z]+)/g, "$1 $2"); // Ensure numbers and units are properly spaced

            // Send the formatted text as the response
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.send(formattedText);

            // Delete the uploaded file after processing
            fs.unlinkSync(imagePath);
        } catch (error) {
            console.error(error);
            res.status(500).send("Failed to process image.");
        }
    });

    const PORT = 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((error) => {
    console.error("Failed to initialize Tesseract worker:", error);
});