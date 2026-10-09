import { Router } from 'express';
import { pool } from '../db/pool.js';               // adjust path if your pool lives elsewhere
import { requireAdmin } from '../middleware/requireAdmin.js'; // adjust path/name if different

const router = Router();

async function recomputeProductRating(productId) {
    await pool.query(
        `UPDATE products
     SET
       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true),
       rating = COALESCE(
         (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1 AND approved = true),
         0
       )
     WHERE id = $1`,
        [productId]
    );
}

// GET /api/reviews?product_id=  — public, approved only
router.get('/', async (req, res) => {
    const { product_id } = req.query;

    try {
        // Admin path: no product_id filter required, admin sees everything
        if (req.isAdmin && !product_id) {
            const result = await pool.query(
                `SELECT * FROM reviews ORDER BY created_at DESC`
            );
            return res.json(result.rows);
        }

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const result = await pool.query(
            `SELECT id, product_id, customer_name, rating, comment, created_at
       FROM reviews
       WHERE product_id = $1 AND approved = true
       ORDER BY created_at DESC`,
            [product_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/public — public, every approved review with its product name
router.get('/public', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.product_id, r.customer_name, r.rating, r.comment, r.created_at,
                    p.name AS product_name
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.approved = true
       ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/reviews/public error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/admin — admin only, all reviews including unapproved
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, p.name AS product_name
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/reviews/admin error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /api/reviews — public, defaults to unapproved
router.post('/', async (req, res) => {
    const { product_id, customer_name, customer_email, rating, comment } = req.body;

    if (!product_id || !customer_name || !customer_email || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO reviews (product_id, customer_name, customer_email, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, customer_name, rating, comment, approved, created_at`,
            [product_id, customer_name, customer_email, rating, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/reviews error:', err);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Invalid product_id' });
        }
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// PATCH /api/reviews/:id/approve — admin only
router.patch('/:id/approve', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE reviews SET approved = true WHERE id = $1 RETURNING product_id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const productId = result.rows[0].product_id;
        await recomputeProductRating(productId);

        res.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/reviews/:id/approve error:', err);
        res.status(500).json({ error: 'Failed to approve review' });
    }
});

// PATCH /api/reviews/:id/unapprove — admin only, hide a review again
router.patch('/:id/unapprove', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE reviews SET approved = false WHERE id = $1 RETURNING product_id`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        await recomputeProductRating(result.rows[0].product_id);
        res.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/reviews/:id/unapprove error:', err);
        res.status(500).json({ error: 'Failed to unapprove review' });
    }
});

// DELETE /api/reviews/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM reviews WHERE id = $1 RETURNING product_id`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const productId = result.rows[0].product_id;
        await recomputeProductRating(productId);

        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/reviews/:id error:', err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
