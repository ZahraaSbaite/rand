import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM process_steps ORDER BY sort_order ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/process-steps error:', err);
        res.status(500).json({ error: 'Failed to fetch process steps' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const { title, description, sort_order } = req.body;
    if (!title || !description) {
        return res.status(400).json({ error: 'title and description are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO process_steps (title, description, sort_order)
       VALUES ($1, $2, COALESCE($3, 0))
       RETURNING *`,
            [title, description, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/process-steps error:', err);
        res.status(500).json({ error: 'Failed to create process step' });
    }
});

router.patch('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, description, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE process_steps SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         sort_order = COALESCE($3, sort_order)
       WHERE id = $4
       RETURNING *`,
            [title, description, sort_order, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /api/process-steps/:id error:', err);
        res.status(500).json({ error: 'Failed to update process step' });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM process_steps WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/process-steps/:id error:', err);
        res.status(500).json({ error: 'Failed to delete process step' });
    }
});

export default router;