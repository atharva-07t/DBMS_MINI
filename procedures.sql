USE student_registration;

DROP PROCEDURE IF EXISTS sp_RegisterStudent;
DROP PROCEDURE IF EXISTS sp_LoginStudent;
DROP PROCEDURE IF EXISTS sp_GetAllCourses;
DROP PROCEDURE IF EXISTS sp_GetCourseDetails;
DROP PROCEDURE IF EXISTS sp_EnrollStudent;
DROP PROCEDURE IF EXISTS sp_RevokeEnrollment;
DROP PROCEDURE IF EXISTS sp_GetStudentEnrollments;

DELIMITER $$

-- ─────────────────────────────────────────────
-- sp_RegisterStudent
-- SQLSTATE 45001 → duplicate email
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_RegisterStudent(
  IN p_name     VARCHAR(100),
  IN p_email    VARCHAR(100),
  IN p_password VARCHAR(255)
)
BEGIN
  DECLARE existing_id INT DEFAULT 0;

  SELECT StudentID INTO existing_id
  FROM Students WHERE Email = p_email LIMIT 1;

  IF existing_id > 0 THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Email already registered';
  END IF;

  INSERT INTO Students (Name, Email, Password) VALUES (p_name, p_email, p_password);

  SELECT StudentID, Name, Email FROM Students WHERE StudentID = LAST_INSERT_ID();
END$$

-- ─────────────────────────────────────────────
-- sp_LoginStudent
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_LoginStudent(IN p_email VARCHAR(100))
BEGIN
  SELECT StudentID, Name, Email, Password
  FROM Students WHERE Email = p_email LIMIT 1;
END$$

-- ─────────────────────────────────────────────
-- sp_GetAllCourses
-- Returns courses with teacher info and enrollment count
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_GetAllCourses()
BEGIN
  SELECT
    c.CourseID,
    c.Name,
    c.Description,
    c.Credits,
    c.Capacity,
    COUNT(e.EnrollmentID)  AS enrolled,
    t.TeacherID,
    t.Name                 AS TeacherName,
    t.Department
  FROM Courses c
  LEFT JOIN Teachers   t ON c.TeacherID  = t.TeacherID
  LEFT JOIN Enrollments e ON c.CourseID  = e.CourseID
  GROUP BY c.CourseID, t.TeacherID;
END$$

-- ─────────────────────────────────────────────
-- sp_GetCourseDetails
-- Full detail for a single course including teacher
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_GetCourseDetails(IN p_course_id INT)
BEGIN
  SELECT
    c.CourseID,
    c.Name,
    c.Description,
    c.Credits,
    c.Capacity,
    COUNT(e.EnrollmentID)  AS enrolled,
    t.TeacherID,
    t.Name                 AS TeacherName,
    t.Department,
    t.Email                AS TeacherEmail
  FROM Courses c
  LEFT JOIN Teachers    t ON c.TeacherID = t.TeacherID
  LEFT JOIN Enrollments e ON c.CourseID  = e.CourseID
  WHERE c.CourseID = p_course_id
  GROUP BY c.CourseID, t.TeacherID;
END$$

-- ─────────────────────────────────────────────
-- sp_EnrollStudent
-- SQLSTATE 45002 → course not found
-- SQLSTATE 45003 → course is full
-- SQLSTATE 45004 → already enrolled
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_EnrollStudent(
  IN p_student_id INT,
  IN p_course_id  INT
)
BEGIN
  DECLARE v_capacity INT DEFAULT 0;
  DECLARE v_enrolled INT DEFAULT 0;
  DECLARE v_already  INT DEFAULT 0;

  SELECT Capacity INTO v_capacity
  FROM Courses WHERE CourseID = p_course_id LIMIT 1;

  IF v_capacity = 0 THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'Course not found';
  END IF;

  SELECT COUNT(*) INTO v_enrolled
  FROM Enrollments WHERE CourseID = p_course_id;

  IF v_enrolled >= v_capacity THEN
    SIGNAL SQLSTATE '45003' SET MESSAGE_TEXT = 'Course is full';
  END IF;

  SELECT COUNT(*) INTO v_already
  FROM Enrollments WHERE StudentID = p_student_id AND CourseID = p_course_id;

  IF v_already > 0 THEN
    SIGNAL SQLSTATE '45004' SET MESSAGE_TEXT = 'Already enrolled in this course';
  END IF;

  INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate)
  VALUES (p_student_id, p_course_id, CURDATE());

  SELECT 'Enrolled successfully' AS message;
END$$

-- ─────────────────────────────────────────────
-- sp_RevokeEnrollment
-- Deletes the enrollment record, freeing capacity.
-- SQLSTATE 45005 → enrollment not found
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_RevokeEnrollment(
  IN p_student_id INT,
  IN p_course_id  INT
)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists
  FROM Enrollments
  WHERE StudentID = p_student_id AND CourseID = p_course_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45005' SET MESSAGE_TEXT = 'Enrollment not found';
  END IF;

  DELETE FROM Enrollments
  WHERE StudentID = p_student_id AND CourseID = p_course_id;

  SELECT 'Enrollment revoked' AS message;
END$$

-- ─────────────────────────────────────────────
-- sp_GetStudentEnrollments
-- Returns enrolled courses with teacher info
-- ─────────────────────────────────────────────
CREATE PROCEDURE sp_GetStudentEnrollments(IN p_student_id INT)
BEGIN
  SELECT
    c.CourseID,
    c.Name,
    c.Description,
    c.Credits,
    e.EnrollmentDate,
    t.Name       AS TeacherName,
    t.Department
  FROM Enrollments e
  JOIN Courses  c ON e.CourseID  = c.CourseID
  LEFT JOIN Teachers t ON c.TeacherID = t.TeacherID
  WHERE e.StudentID = p_student_id;
END$$

DELIMITER ;
