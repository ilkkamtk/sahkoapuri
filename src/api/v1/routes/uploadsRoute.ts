import express from 'express';
import multer from 'multer';
import { upload } from '../controllers/uploadsController';

const router = express.Router();

const uploadMulter = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    const allowedExtensions = ['.xlsx', '.xls'];

    const isValidMime = allowedMimes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext),
    );

    if (isValidMime && isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

router.post('/', uploadMulter.single('file'), upload);

export default router;
