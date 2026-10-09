import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM collections ORDER BY sort_order ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('GET /api/collections error:', err);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    const { name, slug, tagline, image_url, sort_order } = req.body;
    if (!name || !slug) {
        return res.status(400).json({ error: 'name and slug are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO collections (name, slug, tagline, image_url, sort_order)
       VALUES ($1, $2, $3, $4, COALESCE($5, 0))
       RETURNING *`,
            [name, slug, tagline, image_url, sort_order]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /api/collections error:', err);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

router.patch('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, slug, tagline, image_url, sort_order } = req.body;
    try {
        const result = await pool.query(
            `UPDATE collections SET
         name = COALESCE($1, name),
         slug = COALESCE($2, slug),
         tagline = COALESCE($3, tagline),
         image_url = COALESCE($4, image_url),
         sort_order = COALESCE($5, sort_order)
       WHERE id = $6
       RETURNING *`,
            [name, slug, tagline, image_url, sort_order, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /api/collections/:id error:', err);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM collections WHERE id = $1 RETURNING id`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/collections/:id error:', err);
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

export default router;