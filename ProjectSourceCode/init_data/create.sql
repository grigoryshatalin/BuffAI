DROP TABLE IF EXISTS student_courses;
DROP TABLE IF EXISTS prerequisites;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS minors;
DROP TABLE IF EXISTS degrees;
DROP TABLE IF EXISTS student_hobbies;


CREATE TABLE degrees(
  major  VARCHAR (100) NOT NULL, 
  degreeName VARCHAR(5) NOT NULL,  
  classCode VARCHAR(4),   
  reqs JSONB,
  UpperDivisonCreds NUMERIC,
  electives NUMERIC,
  totalCreditHours NUMERIC,
  hasMinor BOOLEAN,
  PRIMARY KEY (major, degreeName)
);

CREATE TABLE minors(
  minor varchar(100) PRIMARY KEY,
  classCode VARCHAR(5),
  reqs JSONB,
  UpperDivisonCreds NUMERIC,
  majorElectives NUMERIC,
  totalCreditHours NUMERIC
);

CREATE TABLE students(
  student_id INTEGER PRIMARY KEY,
  fullName VARCHAR(100),
  email VARCHAR(200) NOT NULL,
  year VARCHAR(15) NOT NULL,
  major VARCHAR(30) NOT NULL,
  degree VARCHAR(15) NOT NULL,
  minor VARCHAR (30), 
  password VARCHAR(255) NOT NULL,
  FOREIGN KEY (major, degree) REFERENCES degrees(major, degreeName),
  FOREIGN KEY (minor) REFERENCES minors(minor)
);

CREATE TABLE courses(
  course_id VARCHAR(20) PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  credit_hours NUMERIC NOT NULL,
  specific_major VARCHAR(100) NULL
);

CREATE TABLE student_courses (
  course_id VARCHAR(20) NOT NULL REFERENCES courses (course_id),
  student_id INTEGER NOT NULL REFERENCES students (student_id),
  year VARCHAR(15);
  PRIMARY KEY (student_id, course_id)
);

CREATE TABLE student_hobbies (
  hobby TEXT NOT NULL,
  student_id INTEGER NOT NULL REFERENCES students(student_id),
  PRIMARY KEY (student_id, hobby)
);

CREATE TABLE prerequisites(
  course_id VARCHAR(50) NOT NULL REFERENCES courses(course_id), 
  slot1  TEXT[], 
  slot2  TEXT[], 
  slot3  TEXT[], 
  slot4  TEXT[], 
  slot5  TEXT[], 
  PRIMARY KEY (course_id)
);