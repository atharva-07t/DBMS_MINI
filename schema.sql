CREATE DATABASE IF NOT EXISTS student_registration;
USE student_registration;

CREATE TABLE IF NOT EXISTS Students (
  StudentID INT AUTO_INCREMENT PRIMARY KEY,
  Name      VARCHAR(100) NOT NULL,
  Email     VARCHAR(100) NOT NULL UNIQUE,
  Password  VARCHAR(255) NOT NULL
);

-- NEW: Teachers table
CREATE TABLE IF NOT EXISTS Teachers (
  TeacherID  INT AUTO_INCREMENT PRIMARY KEY,
  Name       VARCHAR(100) NOT NULL,
  Department VARCHAR(100) NOT NULL,
  Email      VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Courses (
  CourseID    INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(100) NOT NULL,
  Description TEXT,
  Credits     INT NOT NULL,
  Capacity    INT NOT NULL,
  TeacherID   INT,
  FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Enrollments (
  EnrollmentID   INT AUTO_INCREMENT PRIMARY KEY,
  StudentID      INT NOT NULL,
  CourseID       INT NOT NULL,
  EnrollmentDate DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (StudentID) REFERENCES Students(StudentID) ON DELETE CASCADE,
  FOREIGN KEY (CourseID)  REFERENCES Courses(CourseID)  ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (StudentID, CourseID)
);

-- Sample teachers
INSERT INTO Teachers (Name, Department, Email) VALUES
('Dr. Alan Turing',    'Computer Science', 'turing@university.edu'),
('Prof. Ada Lovelace', 'Mathematics',      'lovelace@university.edu'),
('Dr. Grace Hopper',   'English',          'hopper@university.edu'),
('Prof. Linus Torvalds','Computer Science','torvalds@university.edu'),
('Dr. Tim Berners-Lee','Web Technologies', 'tbl@university.edu');

-- Sample courses (with TeacherID)
INSERT INTO Courses (Name, Description, Credits, Capacity, TeacherID) VALUES
('Introduction to Computer Science', 'Fundamentals of programming and computation.', 3, 30, 1),
('Calculus I',                        'Limits, derivatives, and integrals.',           4, 25, 2),
('English Composition',               'Academic writing and critical thinking.',        3, 20, 3),
('Data Structures',                   'Arrays, linked lists, trees, and graphs.',       3, 25, 4),
('Web Development',                   'HTML, CSS, JavaScript, and modern frameworks.',  3, 30, 5);
