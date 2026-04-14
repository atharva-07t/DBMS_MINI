import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const student = JSON.parse(localStorage.getItem('student') || '{}');
  const initials = student.name
    ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span>🎓</span> CourseReg
      </Link>
      <div className="navbar-links">
        <Link to="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Courses</Link>
        <Link to="/profile"   className={pathname === '/profile'   ? 'active' : ''}>My Enrollments</Link>
      </div>
      <div className="navbar-user">
        <div className="navbar-avatar">{initials}</div>
        <button className="btn btn-ghost" onClick={logout} style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
