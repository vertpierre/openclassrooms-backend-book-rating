const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
}).single('image');

const optimizeImage = async (req, res, next) => {
  if (!req.file) return next();

  const filename = req.file.originalname.split(' ').join('_') + '-' + Date.now() + '.webp';
  const outputPath = path.join('images', filename);

  try {
    await sharp(req.file.buffer)
      .resize({ width: 1080, height: 1080, fit: 'inside' })
      .webp({ quality: 70 })
      .toFile(outputPath);
    
    req.file.filename = filename;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = [upload, optimizeImage];