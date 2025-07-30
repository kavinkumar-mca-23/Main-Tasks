const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const allowedExtensions = [
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heif', 'heic',
  'mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm', '3gp', '3g2',
  'pdf', 'docx', 'pptx', 'txt', 'zip'
];

const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only supported file formats are allowed'), false);
    }
  }
});

module.exports = upload;
