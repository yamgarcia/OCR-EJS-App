const express = require("express");
const app = express();

const fs = require("fs");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
// install the last version:
// npm i tesseract.js@next

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  // takes cb (callback) in order to use the original name
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }).single("avatar");

app.set("view engine", "ejs");

/**
 * @route    GET api/
 * @desc     Render pages using the ejs index file
 * @access   Public
 */
app.get("/", (req, res) => {
  res.render("index");
});

/**
 * @route    POST api/upload
 * @desc     Log progress
 * @access   Public
 */
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {
      if (err) return console.log(err);

      (async () => {
        try {
          const worker = createWorker();
          await worker.load();
          await worker.loadLanguage("eng");
          await worker.initialize("eng");
          const {
            data: { text },
          } = await worker.recognize(data, "eng", { tessjs_create_pdf: "1" });
          console.log(text);
          res.redirect("/download");
          console.log("Generate PDF: tesseract-ocr-result.pdf");

          await worker.terminate();
        } catch (error) {
          console.error(error);
        }
      })();
    });
  });
});

/**
 * @route    GET api/download
 * @desc     Download
 * @access   Public
 */
app.get("/download", (req, res) => {
  const file = `${__dirname}/tesseract-ocr-result.pdf`;
  res.download(file);
});

const PORT = 5000 || process.env.PORT;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
