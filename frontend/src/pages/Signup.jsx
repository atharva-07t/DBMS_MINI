import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const DEPARTMENTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'English', 'Business Administration', 'Mechanical Engineering',
  'Electrical Engineering', 'Web Technologies', 'Other',
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', yearOfStudy: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('student', JSON.stringify(data.student));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-logo">🎓</div>
        <h2>CourseReg</h2>
        <p>Join thousands of students managing their academic journey with ease.</p>
        <div className="auth-features">
          <div className="auth-feature"><span>🔒</span><span>Secure student accounts</span></div>
          <div className="auth-feature"><span>📋</span><span>Real-time capacity tracking</span></div>
          <div className="auth-feature"><span>🏫</span><span>Department &amp; instructor info</span></div>
          <div className="auth-feature"><span>↩️</span><span>Revoke enrollments anytime</span></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h1>Create account</h1>
          <p>Register as a new student</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="John Doe" required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="you@university.edu" required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters" minLength={6} required
              />
            </div>

            {/* ── NEW FIELDS ── */}
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select name="department" value={form.department} onChange={handleChange} required>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Year of Study</label>
                <select name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange} required>
                  <option value="">Select year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <div className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
