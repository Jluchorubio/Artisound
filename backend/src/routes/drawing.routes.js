import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

const drawingSchema = z.object({
  title: z.string().max(150).optional(),
  description: z.string().max(255).optional(),
  imageBase64: z.string().min(100),
  format: z.string().default('image/png').optional(),
});

router.post('/drawings', authenticate, async (req, res) => {
  try {
    const parsed = drawingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { title = null, description = null, imageBase64, format = 'image/png' } = parsed.data;

    if (Buffer.byteLength(imageBase64, 'utf8') > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Imagen demasiado grande. Maximo 5MB en base64' });
    }

    const result = await query(
      `INSERT INTO drawings (user_id, title, description, format, image_base64)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, title, description, format, imageBase64],
    );

    return res.status(201).json({ message: 'Dibujo guardado', drawingId: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo guardar el dibujo' });
  }
});

router.put('/drawings/:id', authenticate, async (req, res) => {
  try {
    const drawingId = Number(req.params.id);
    if (Number.isNaN(drawingId)) {
      return res.status(400).json({ message: 'ID de dibujo invalido' });
    }

    const parsed = drawingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos', errors: parsed.error.issues });
    }

    const { title = null, description = null, imageBase64, format = 'image/png' } = parsed.data;

    if (Buffer.byteLength(imageBase64, 'utf8') > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Imagen demasiado grande. Maximo 5MB en base64' });
    }

    const result = await query(
      `UPDATE drawings
       SET title = ?, description = ?, format = ?, image_base64 = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, format, imageBase64, drawingId, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dibujo no encontrado' });
    }

    return res.status(200).json({ message: 'Dibujo actualizado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo actualizar el dibujo' });
  }
});

router.get('/drawings/me', authenticate, async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, title, description, format, image_base64, created_at
       FROM drawings
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    return res.status(200).json({ drawings: rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo obtener tu portafolio' });
  }
});

router.delete('/drawings/:id', authenticate, async (req, res) => {
  try {
    const drawingId = Number(req.params.id);
    if (Number.isNaN(drawingId)) {
      return res.status(400).json({ message: 'ID de dibujo invalido' });
    }

    const result = await query('DELETE FROM drawings WHERE id = ? AND user_id = ?', [drawingId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Dibujo no encontrado' });
    }

    return res.status(200).json({ message: 'Dibujo eliminado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo eliminar el dibujo' });
  }
});

export default router;
