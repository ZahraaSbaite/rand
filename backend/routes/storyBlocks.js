import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM story_blocks ORDER BY sort_order ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/story-blocks error:', err);
        res.status(500).json({ error: 'Failed to fetch story blocks' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const { heading, body, image_url, sort_order } = req.body;
    if (!heading || !body) {
        return res.status(400).json({ error: 'heading and body are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO story_blocks (heading, body, image_url, sort_order)
       VALUES ($1, $2, $3, COALESCE($4, 0))
       RETURNING *`,
            [heading, body, image_url, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/story-blocks error:', err);
        res.status(500).json({ error: 'Failed to create story block' });
    }
});

router.patch('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { heading, body, image_url, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE story_blocks SET
         heading = COALESCE($1, heading),
         body = COALESCE($2, body),
         image_url = COALESCE($3, image_url),
         sort_order = COALESCE($4, sort_order)
       WHERE id = $5
       RETURNING *`,
            [heading, body, image_url, sort_order, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /api/story-blocks/:id error:', err);
        res.status(500).json({ error: 'Failed to update story block' });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM story_blocks WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/story-blocks/:id error:', err);
        res.status(500).json({ error: 'Failed to delete story block' });
    }
});

export default router;