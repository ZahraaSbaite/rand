import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM faqs ORDER BY category ASC, sort_order ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/faqs error:', err);
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const { category, question, answer, sort_order } = req.body;
    if (!category || !question || !answer) {
        return res.status(400).json({ error: 'category, question and answer are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO faqs (category, question, answer, sort_order)
       VALUES ($1, $2, $3, COALESCE($4, 0))
       RETURNING *`,
            [category, question, answer, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/faqs error:', err);
        res.status(500).json({ error: 'Failed to create FAQ' });
    }
});

router.patch('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { category, question, answer, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE faqs SET
         category = COALESCE($1, category),
         question = COALESCE($2, question),
         answer = COALESCE($3, answer),
         sort_order = COALESCE($4, sort_order)
       WHERE id = $5
       RETURNING *`,
            [category, question, answer, sort_order, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /api/faqs/:id error:', err);
        res.status(500).json({ error: 'Failed to update FAQ' });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM faqs WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/faqs/:id error:', err);
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

export default router;