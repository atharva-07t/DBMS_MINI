-- ============================================================
--  COMPLETE SETUP SCRIPT v3
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_registration;
USE student_registration;

-- Drop tables in FK-safe order
DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Teachers;
DROP TABLE IF EXISTS Students;

-- ── STUDENTS (with Department + YearOfStudy) ────────────────
CREATE TABLE Students (
  StudentID   INT          AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100) NOT NULL,
  Email       VARCHAR(100) NOT NULL UNIQUE,
  Password    VARCHAR(255) NOT NULL,
  Department  VARCHAR(100) NOT NULL DEFAULT '',
  YearOfStudy INT          NOT NULL DEFAULT 1
);

-- ── TEACHERS ────────────────────────────────────────────────
CREATE TABLE Teachers (
  TeacherID   INT          AUTO_INCREMENT PRIMARY KEY,
  TeacherName VARCHAR(100) NOT NULL,
  Department  VARCHAR(100) NOT NULL,
  Email       VARCHAR(100) NOT NULL UNIQUE
);

-- ── COURSES (FK → Teachers) ──────────────────────────────────
CREATE TABLE Courses (
  CourseID    INT          AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100) NOT NULL,
  Description TEXT,
  Credits     INT          NOT NULL,
  Capacity    INT          NOT NULL,
  TeacherID   INT,
  FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID) ON DELETE SET NULL
);

-- ── ENROLLMENTS ──────────────────────────────────────────────
CREATE TABLE Enrollments (
  EnrollmentID   INT  AUTO_INCREMENT PRIMARY KEY,
  StudentID      INT  NOT NULL,
  CourseID       INT  NOT NULL,
  EnrollmentDate DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE,
  FOREIGN KEY (CourseID)  REFERENCES Courses(CourseID)  ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (StudentID, CourseID)
);

-- ── SEED: 5 Teachers ─────────────────────────────────────────
INSERT INTO Teachers (TeacherName, Department, Email) VALUES
('Dr. Alan Turing',      'Computer Science', 'turing@university.edu'),
('Prof. Ada Lovelace',   'Mathematics',      'lovelace@university.edu'),
('Dr. Grace Hopper',     'English',          'hopper@university.edu'),
('Prof. Linus Torvalds', 'Computer Science', 'torvalds@university.edu'),
('Dr. Tim Berners-Lee',  'Web Technologies', 'tbl@university.edu');

-- ── SEED: 5 Courses linked to teachers ───────────────────────
INSERT INTO Courses (Name, Description, Credits, Capacity, TeacherID) VALUES
('Introduction to Computer Science', 'Fundamentals of programming and computation.',  3, 30, 1),
('Calculus I',                        'Limits, derivatives, and integrals.',            4, 25, 2),
('English Composition',               'Academic writing and critical thinking.',         3, 20, 3),
('Data Structures',                   'Arrays, linked lists, trees, and graphs.',        3, 25, 4),
('Web Development',                   'HTML, CSS, JavaScript, and modern frameworks.',   3, 30, 5);

-- ── DROP OLD PROCEDURES ───────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_RegisterStudent;
DROP PROCEDURE IF EXISTS sp_LoginStudent;
DROP PROCEDURE IF EXISTS sp_GetAllCourses;
DROP PROCEDURE IF EXISTS sp_GetCourseDetails;
DROP PROCEDURE IF EXISTS sp_EnrollStudent;
DROP PROCEDURE IF EXISTS sp_RevokeEnrollment;
DROP PROCEDURE IF EXISTS sp_GetStudentEnrollments;
DROP VIEW     IF EXISTS vw_EnrolledCourses;

-- ── VIEW: enrolled courses with teacher info ──────────────────
CREATE VIEW vw_EnrolledCourses AS
SELECT
  e.StudentID,
  c.CourseID,
  c.Name          AS CourseName,
  c.Description,
  c.Credits,
  e.EnrollmentDate,
  t.TeacherName,
  t.Department    AS TeacherDepartment
FROM Enrollments e
JOIN  Courses  c ON e.CourseID  = c.CourseID
LEFT JOIN Teachers t ON c.TeacherID = t.TeacherID;

-- ============================================================
--  STORED PROCEDURES  —  DELIMITER must be $$ in Workbench
-- ============================================================
DELIMITER $$

-- ── sp_RegisterStudent (now accepts Department + YearOfStudy) ─
CREATE PROCEDURE sp_RegisterStudent(
  IN p_name       VARCHAR(100),
  IN p_email      VARCHAR(100),
  IN p_password   VARCHAR(255),
  IN p_department VARCHAR(100),
  IN p_year       INT
)
BEGIN
  DECLARE v_existing INT DEFAULT 0;

  SELECT COUNT(*) INTO v_existing
  FROM Students WHERE Email = p_email;

  IF v_existing > 0 THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Email already registered';
  END IF;

  INSERT INTO Students (Name, Email, Password, Department, YearOfStudy)
  VALUES (p_name, p_email, p_password, p_department, p_year);

  SELECT StudentID, Name, Email, Department, YearOfStudy
  FROM Students WHERE StudentID = LAST_INSERT_ID();
END$$

-- ── sp_LoginStudent ───────────────────────────────────────────
CREATE PROCEDURE sp_LoginStudent(IN p_email VARCHAR(100))
BEGIN
  SELECT StudentID, Name, Email, Password, Department, YearOfStudy
  FROM Students WHERE Email = p_email LIMIT 1;
END$$

-- ── sp_GetAllCourses ──────────────────────────────────────────
CREATE PROCEDURE sp_GetAllCourses()
BEGIN
  SELECT
    c.CourseID,
    c.Name,
    c.Description,
    c.Credits,
    c.Capacity,
    COUNT(e.EnrollmentID) AS enrolled,
    t.TeacherID,
    t.TeacherName,
    t.Department
  FROM Courses c
  LEFT JOIN Teachers    t ON c.TeacherID = t.TeacherID
  LEFT JOIN Enrollments e ON c.CourseID  = e.CourseID
  GROUP BY c.CourseID, t.TeacherID, t.TeacherName, t.Department;
END$$

-- ── sp_GetCourseDetails ───────────────────────────────────────
CREATE PROCEDURE sp_GetCourseDetails(IN p_course_id INT)
BEGIN
  SELECT
    c.CourseID,
    c.Name,
    c.Description,
    c.Credits,
    c.Capacity,
    COUNT(e.EnrollmentID) AS enrolled,
    t.TeacherID,
    t.TeacherName,
    t.Department,
    t.Email AS TeacherEmail
  FROM Courses c
  LEFT JOIN Teachers    t ON c.TeacherID = t.TeacherID
  LEFT JOIN Enrollments e ON c.CourseID  = e.CourseID
  WHERE c.CourseID = p_course_id
  GROUP BY c.CourseID, t.TeacherID, t.TeacherName, t.Department, t.Email;
END$$

-- ── sp_EnrollStudent ──────────────────────────────────────────
CREATE PROCEDURE sp_EnrollStudent(
  IN p_student_id INT,
  IN p_course_id  INT
)
BEGIN
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_enrolled INT DEFAULT 0;
  DECLARE v_already  INT DEFAULT 0;

  SELECT Capacity INTO v_capacity FROM Courses WHERE CourseID = p_course_id LIMIT 1;
  IF v_capacity = 0 THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'Course not found';
  END IF;

  SELECT COUNT(*) INTO v_enrolled FROM Enrollments WHERE CourseID = p_course_id;
  IF v_enrolled >= v_capacity THEN
    SIGNAL SQLSTATE '45003' SET MESSAGE_TEXT = 'Course is full';
  END IF;

  SELECT COUNT(*) INTO v_already FROM Enrollments WHERE StudentID = p_student_id AND CourseID = p_course_id;
  IF v_already > 0 THEN
    SIGNAL SQLSTATE '45004' SET MESSAGE_TEXT = 'Already enrolled in this course';
  END IF;

  INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate)
  VALUES (p_student_id, p_course_id, CURDATE());

  SELECT 'Enrolled successfully' AS message;
END$$

-- ── sp_RevokeEnrollment ───────────────────────────────────────
CREATE PROCEDURE sp_RevokeEnrollment(
  IN p_student_id INT,
  IN p_course_id  INT
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists FROM Enrollments
  WHERE StudentID = p_student_id AND CourseID = p_course_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45005' SET MESSAGE_TEXT = 'Enrollment not found';
  END IF;

  DELETE FROM Enrollments WHERE StudentID = p_student_id AND CourseID = p_course_id;
  SELECT 'Enrollment revoked' AS message;
END$$

-- ── sp_GetStudentEnrollments (uses the view) ──────────────────
CREATE PROCEDURE sp_GetStudentEnrollments(IN p_student_id INT)
BEGIN
  SELECT CourseID, CourseName AS Name, Description, Credits,
         EnrollmentDate, TeacherName, TeacherDepartment AS Department
  FROM vw_EnrolledCourses
  WHERE StudentID = p_student_id;
END$$

DELIMITER ;

-- ── VERIFY ────────────────────────────────────────────────────
SELECT 'Tables' AS type, TABLE_NAME AS name
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'student_registration' AND TABLE_TYPE = 'BASE TABLE'
UNION ALL
SELECT 'View', TABLE_NAME
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'student_registration'
UNION ALL
SELECT 'Procedure', ROUTINE_NAME
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'student_registration' AND ROUTINE_TYPE = 'PROCEDURE';

SELECT c.Name AS Course, t.TeacherName, t.Department
FROM Courses c LEFT JOIN Teachers t ON c.TeacherID = t.TeacherID;

SELECT *FROM Enrollments;
