import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import RegisterModal from '../components/RegisterModal';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../api';

export default function Dashboard() {
  const [courses, setCourses]       = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all'); // all | open | full
  const [selected, setSelected]     = useState(null);  // course for modal
  const [enrolled, setEnrolled]     = useState(new Set());
  const { toasts, addToast }        = useToast();

  const fetchCourses = () =>
    api.get('/courses').then(({ data }) => {
      setCourses(data);
      setFiltered(data);
    }).finally(() => setLoading(false));

  const fetchMyEnrollments = () =>
    api.get('/enrollments/my').then(({ data }) => {
      setEnrolled(new Set(data.map((e) => e.CourseID)));
    });

  useEffect(() => {
    fetchCourses();
    fetchMyEnrollments();
  }, []);

  // Search + filter
  useEffect(() => {
    let list = courses;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.Name.toLowerCase().includes(q) ||
               (c.TeacherName || '').toLowerCase().includes(q) ||
               (c.Department  || '').toLowerCase().includes(q)
      );
    }
    if (filter === 'open') list = list.filter((c) => c.enrolled < c.Capacity);
    if (filter === 'full') list = list.filter((c) => c.enrolled >= c.Capacity);
    setFiltered(list);
  }, [search, filter, courses]);

  const handleSuccess = (msg) => {
    addToast(msg, 'success');
    fetchCourses();
    fetchMyEnrollments();
  };

  const openCount = courses.filter((c) => c.enrolled < c.Capacity).length;

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getCapacityClass = (enrolled, capacity) => {
    const pct = (enrolled / capacity) * 100;
    if (pct >= 90) return 'high';
    if (pct >= 60) return 'medium';
    return 'low';
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="page-header">
          <h1>Available Courses</h1>
          <p>Browse and register for courses this semester</p>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-icon">📚</span>
            <div className="stat-info">
              <label>Total Courses</label>
              <p>{courses.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <label>Open</label>
              <p>{openCount}</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <div className="stat-info">
              <label>My Enrollments</label>
              <p>{enrolled.size}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search by course, teacher, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {['all', 'open', 'full'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'open' ? '✅ Open' : '🔴 Full'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading courses...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No courses match your search.</p>
          </div>
        ) : (
          <div className="course-grid">
            {filtered.map((course) => {
              const isFull    = course.enrolled >= course.Capacity;
              const isEnrolled = enrolled.has(course.CourseID);
              const pct       = Math.round((course.enrolled / course.Capacity) * 100);
              const capClass  = getCapacityClass(course.enrolled, course.Capacity);

              return (
                <div className="course-card" key={course.CourseID}>
                  <div className={`course-card-accent ${isFull ? 'full' : ''}`} />
                  <div className="course-card-body">
                    <div className="course-card-header">
                      <h3>{course.Name}</h3>
                      <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                        {isFull ? '🔴 Full' : '🟢 Open'}
                      </span>
                    </div>

                    <p className="course-desc">{course.Description}</p>

                    {course.TeacherName && (
                      <div className="teacher-row">
                        <div className="teacher-avatar">{getInitials(course.TeacherName)}</div>
                        <div className="teacher-info">
                          <strong>{course.TeacherName}</strong>
                          <span>{course.Department}</span>
                        </div>
                      </div>
                    )}

                    <div className="course-meta">
                      <span className="badge badge-blue">📚 {course.Credits} credits</span>
                      {isEnrolled && <span className="badge badge-purple">✓ Enrolled</span>}
                    </div>

                    <div className="capacity-bar-wrap">
                      <div className="capacity-label">
                        <span>Capacity</span>
                        <span>{course.enrolled}/{course.Capacity} ({pct}%)</span>
                      </div>
                      <div className="capacity-bar">
                        <div className={`capacity-fill ${capClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="course-card-footer">
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {course.Capacity - course.enrolled} seat{course.Capacity - course.enrolled !== 1 ? 's' : ''} left
                    </span>
                    <button
                      className={`btn ${isEnrolled ? 'btn-ghost' : isFull ? 'btn-danger' : 'btn-success'}`}
                      disabled={isFull || isEnrolled}
                      onClick={() => setSelected(course)}
                      style={{ width: 'auto' }}
                    >
                      {isEnrolled ? '✓ Enrolled' : isFull ? 'Course Full' : 'Register →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <RegisterModal
          course={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}
