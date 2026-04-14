const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, department, yearOfStudy } = req.body;

  if (!name || !email || !password || !department || !yearOfStudy)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [rows] = await pool.query(
      'CALL sp_RegisterStudent(?, ?, ?, ?, ?)',
      [name, email, hashed, department, parseInt(yearOfStudy)]
    );

    const student = rows[0][0];
    const token = jwt.sign(
      { id: student.StudentID, name: student.Name, email: student.Email,
        department: student.Department, yearOfStudy: student.YearOfStudy },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      student: {
        id: student.StudentID, name: student.Name, email: student.Email,
        department: student.Department, yearOfStudy: student.YearOfStudy
      }
    });
  } catch (err) {
    console.error('[SIGNUP ERROR]', { code: err.code, sqlState: err.sqlState, message: err.message });
    if (err.sqlState === '45001')
      return res.status(409).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const [rows] = await pool.query('CALL sp_LoginStudent(?)', [email]);
    const students = rows[0];

    if (students.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const student = students[0];
    const match = await bcrypt.compare(password, student.Password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: student.StudentID, name: student.Name, email: student.Email,
        department: student.Department, yearOfStudy: student.YearOfStudy },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      student: {
        id: student.StudentID, name: student.Name, email: student.Email,
        department: student.Department, yearOfStudy: student.YearOfStudy
      }
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', { code: err.code, sqlState: err.sqlState, message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
