DROP TABLE IF EXISTS students;
CREATE TABLE students (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(200) NOT NULL,
  year VARCHAR(15) NOT NULL,
  major VARCHAR(30) NOT NULL,
  degree VARCHAR(15) NOT NULL
);

DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
  course_id NUMERIC PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  credit_hours NUMERIC NOT NULL
  specific_major VARCHAR(100) NULL
);

DROP TABLE IF EXISTS student_courses;
CREATE TABLE student_courses (
  course_id INTEGER NOT NULL REFERENCES courses (course_id),
  student_id INTEGER NOT NULL REFERENCES students (student_id)
);
  
DROP TABLE IF EXISTS prerequisites;

CREATE TABLE prerequisites (
  course_id NUMERIC NOT NULL,
  prerequisite_id NUMERIC NOT NULL,
  PRIMARY KEY (course_id, prerequisite_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
  FOREIGN KEY (prerequisite_id) REFERENCES courses(course_id) ON DELETE CASCADE
);





