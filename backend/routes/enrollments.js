const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const stateMap = {
  '45002': [404, 'Course not found'],
  '45003': [400, 'Course is full'],
  '45004': [409, 'Already enrolled in this course'],
  '45005': [404, 'Enrollment not found'],
};

// POST /api/enrollments
router.post('/', authMiddleware, async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.student.id;
  try {
    await pool.query('CALL sp_EnrollStudent(?, ?)', [studentId, courseId]);
    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err) {
    console.error('[ENROLL ERROR]', { code: err.code, sqlState: err.sqlState, message: err.message });
    const mapped = stateMap[err.sqlState];
    if (mapped) return res.status(mapped[0]).json({ message: mapped[1] });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/enrollments/:courseId
router.delete('/:courseId', authMiddleware, async (req, res) => {
  const studentId = req.student.id;
  const courseId = req.params.courseId;
  try {
    await pool.query('CALL sp_RevokeEnrollment(?, ?)', [studentId, courseId]);
    res.json({ message: 'Enrollment revoked' });
  } catch (err) {
    console.error('[REVOKE ERROR]', { code: err.code, sqlState: err.sqlState, message: err.message });
    const mapped = stateMap[err.sqlState];
    if (mapped) return res.status(mapped[0]).json({ message: mapped[1] });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/enrollments/my
router.get('/my', authMiddleware, async (req, res) => {
  const studentId = req.student.id;
  try {
    const [rows] = await pool.query('CALL sp_GetStudentEnrollments(?)', [studentId]);
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET ENROLLMENTS ERROR]', { code: err.code, sqlState: err.sqlState, message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
