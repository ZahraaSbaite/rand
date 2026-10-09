import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { saveUpload } from '../lib/fileStore.js';

const upload = multer({
    storage: multer.memoryStorage(),
    // Netlify functions cap request bodies at ~6MB, which is ~4.5MB of file once encoded
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
        }
    },
});

const router = Router();

// POST /api/upload — admin only, single image
router.post('/', requireAdmin, upload.single('image'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        res.status(201).json({ url: await saveUpload(req.file) });
    } catch (err) {
        next(err);
    }
});

export default router;
