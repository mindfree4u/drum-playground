// server/routes/videos.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, 'VIDEO-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
}).single('video');

router.post('/', (req, res) => {
  upload(req, res, err => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ message: 'Video uploaded successfully' });
    }
  });
});

module.exports = router;