import { useState } from 'react';
import api from '../api';

export default function RegisterModal({ course, onClose, onSuccess }) {
  const student = JSON.parse(localStorage.getItem('student') || '{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-filled read-only student info + confirmation step
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/enrollments', { courseId: course.CourseID });
      onSuccess(`Successfully enrolled in "${course.Name}"`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.round((course.enrolled / course.Capacity) * 100);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>Course Registration</h2>
            <p>Review details and confirm your enrollment</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            {/* Course summary */}
            <div className="modal-course-info">
              <strong>{course.Name}</strong>
              <span>👨‍🏫 {course.TeacherName || 'TBA'} · {course.Department || ''}</span>
              <span>📚 {course.Credits} credits &nbsp;·&nbsp; 👥 {course.enrolled}/{course.Capacity} enrolled</span>
              <div style={{ marginTop: '0.5rem' }}>
                <div className="capacity-bar">
                  <div
                    className={`capacity-fill ${pct >= 90 ? 'high' : pct >= 60 ? 'medium' : 'low'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Student details (read-only) */}
            <div className="form-group">
              <label>Student Name</label>
              <input type="text" value={student.name || ''} readOnly style={{ background: '#f9fafb', cursor: 'default' }} />
            </div>
            <div className="form-group">
              <label>Student Email</label>
              <input type="email" value={student.email || ''} readOnly style={{ background: '#f9fafb', cursor: 'default' }} />
            </div>

            {confirmed && (
              <div className="success-msg" style={{ marginBottom: 0 }}>
                ✅ Please click "Confirm Enrollment" to finalize your registration.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading} style={{ width: 'auto' }}>
              {loading ? 'Enrolling...' : confirmed ? 'Confirm Enrollment' : 'Register →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
