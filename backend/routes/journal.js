import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM journal_entries ORDER BY sort_order ASC, entry_date DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/journal error:', err);
        res.status(500).json({ error: 'Failed to fetch journal entries' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const { tag, entry_date, title, story, image_url, sort_order } = req.body;
    if (!title || !story) {
        return res.status(400).json({ error: 'title and story are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO journal_entries (tag, entry_date, title, story, image_url, sort_order)
       VALUES (COALESCE($1, 'Inspiration'), COALESCE($2, CURRENT_DATE), $3, $4, $5, COALESCE($6, 0))
       RETURNING *`,
            [tag, entry_date, title, story, image_url, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/journal error:', err);
        res.status(500).json({ error: 'Failed to create journal entry' });
    }
});

router.patch('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { tag, entry_date, title, story, image_url, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE journal_entries SET
         tag = COALESCE($1, tag),
         entry_date = COALESCE($2, entry_date),
         title = COALESCE($3, title),
         story = COALESCE($4, story),
         image_url = COALESCE($5, image_url),
         sort_order = COALESCE($6, sort_order)
       WHERE id = $7
       RETURNING *`,
            [tag, entry_date, title, story, image_url, sort_order, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /api/journal/:id error:', err);
        res.status(500).json({ error: 'Failed to update journal entry' });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM journal_entries WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/journal/:id error:', err);
        res.status(500).json({ error: 'Failed to delete journal entry' });
    }
});

export default router;