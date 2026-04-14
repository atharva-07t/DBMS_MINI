import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../api';

export default function Profile() {
  const student = JSON.parse(localStorage.getItem('student') || '{}');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [revoking, setRevoking]       = useState(null); // courseId being revoked
  const { toasts, addToast }          = useToast();

  const initials = student.name
    ? student.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const fetchEnrollments = () =>
    api.get('/enrollments/my')
      .then(({ data }) => setEnrollments(data))
      .finally(() => setLoading(false));

  useEffect(() => { fetchEnrollments(); }, []);

  const handleRevoke = async (courseId, courseName) => {
    if (!window.confirm(`Remove enrollment from "${courseName}"?`)) return;
    setRevoking(courseId);
    try {
      await api.delete(`/enrollments/${courseId}`);
      addToast(`Removed from "${courseName}"`, 'success');
      fetchEnrollments();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to revoke', 'error');
    } finally {
      setRevoking(null);
    }
  };

  const totalCredits = enrollments.reduce((sum, e) => sum + e.Credits, 0);

  return (
    <>
      <Navbar />
      <div className="page">
        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-lg">{initials}</div>
          <div className="profile-hero-info">
            <h2>{student.name}</h2>
            <p>{student.email}</p>
            {student.department && (
              <p style={{ marginTop: '0.3rem', opacity: 0.85, fontSize: '0.85rem' }}>
                🏫 {student.department}
                {student.yearOfStudy ? ` · Year ${student.yearOfStudy}` : ''}
              </p>
            )}
          </div>
          <div className="profile-hero-stats">
            <strong>{enrollments.length}</strong>
            <span>Courses Enrolled</span>
            <strong style={{ marginTop: '0.5rem' }}>{totalCredits}</strong>
            <span>Total Credits</span>
          </div>
        </div>

        {/* Enrollments table */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>My Enrollments</h3>
            {enrollments.length > 0 && (
              <span className="badge badge-blue">{enrollments.length} course{enrollments.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading ? (
            <div className="loading"><div className="spinner" /> Loading your courses...</div>
          ) : enrollments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>You haven't enrolled in any courses yet.</p>
              <a href="/dashboard" className="btn btn-primary" style={{ width: 'auto', display: 'inline-flex' }}>
                Browse Courses →
              </a>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Instructor</th>
                  <th>Department</th>
                  <th>Credits</th>
                  <th>Enrolled On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.CourseID}>
                    <td>
                      <strong style={{ color: 'var(--gray-900)', display: 'block' }}>{e.Name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{e.Description?.slice(0, 55)}{e.Description?.length > 55 ? '…' : ''}</span>
                    </td>
                    <td>{e.TeacherName || <span style={{ color: 'var(--gray-400)' }}>TBA</span>}</td>
                    <td>
                      {e.Department
                        ? <span className="badge badge-purple">{e.Department}</span>
                        : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                    </td>
                    <td><span className="badge badge-blue">{e.Credits} cr</span></td>
                    <td style={{ color: 'var(--gray-500)' }}>
                      {new Date(e.EnrollmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        disabled={revoking === e.CourseID}
                        onClick={() => handleRevoke(e.CourseID, e.Name)}
                      >
                        {revoking === e.CourseID ? 'Removing...' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
