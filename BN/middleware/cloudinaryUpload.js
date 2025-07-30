const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'posts',
    allowed_formats:  [
      // Image formats
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'heif', 'heic',

      // Video formats
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm', '3gp', '3g2',

      // Optional raw formats (like pdf or zip)
      'pdf', 'docx', 'pptx', 'txt', 'zip'
    ],
    resource_type: 'auto', // handles both image and video
  }),
});

const upload = multer({ storage });

module.exports = upload;
