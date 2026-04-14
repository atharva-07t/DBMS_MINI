const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/courses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('CALL sp_GetAllCourses()');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('CALL sp_GetCourseDetails(?)', [req.params.id]);
    const course = rows[0][0];
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
