import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('student', JSON.stringify(data.student));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-logo">🎓</div>
        <h2>CourseReg</h2>
        <p>Your all-in-one platform for course discovery and registration.</p>
        <div className="auth-features">
          <div className="auth-feature"><span>📚</span><span>Browse all available courses</span></div>
          <div className="auth-feature"><span>👨‍🏫</span><span>See assigned instructors</span></div>
          <div className="auth-feature"><span>⚡</span><span>Register in seconds</span></div>
          <div className="auth-feature"><span>🗂️</span><span>Manage your enrollments</span></div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p>Sign in to your student account</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@university.edu" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <div className="auth-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
