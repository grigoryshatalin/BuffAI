DROP TABLE IF EXISTS students;
CREATE TABLE students (
  student_id SERIAL PRIMARY KEY,
  fullName VARCHAR(100),
  email VARCHAR(200) NOT NULL,
  year VARCHAR(15) NOT NULL,
  major VARCHAR(30) NOT NULL,
  degree VARCHAR(15) NOT NULL,
  minor VARCHAR (30), 
  password VARCHAR(50) NOT NULL,
  FOREIGN KEY (major, degree) REFERENCES degrees(major, degreeName),
  FOREIGN KEY (minor) REFERENCES minors(minor)
);

DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
  course_id VARCHAR(20) PRIMARY KEY,
  course_name VARCHAR(100) NOT NULL,
  credit_hours NUMERIC NOT NULL,
  specific_major VARCHAR(100) NULL --only {specific_major}s can take this course 
);

DROP TABLE IF EXISTS student_courses;
CREATE TABLE student_courses (
  course_id VARCHAR(20) NOT NULL REFERENCES courses (course_id),
  student_id INTEGER NOT NULL REFERENCES students (student_id)
);
  
DROP TABLE IF EXISTS prerequisites;
CREATE TABLE prerequisites (
  course_id VARCHAR(50) NOT NULL REFERENCES courses(course_id), 
  slot1  TEXT[], 
  slot2  TEXT[], 
  slot3  TEXT[],  -- each slot can have 0, 1, or more classes, you must have taken a course from each of the (non NULL) slots to complete prerequisites 
  slot4  TEXT[], 
  slot5  TEXT[], 
  PRIMARY KEY (course_id)
);

DROP TABLE IF EXISTS degrees;
CREATE TABLE degrees (
  major  VARCHAR (100) NOT NULL, 
  degreeName VARCHAR(5) NOT NULL,  -- ex. BA, BS
  classCode VARCHAR(4),   -- ex. major in computer science is CSCI, major in Theatre is THTR, etc.. 
  reqs JSONB,
  UpperDivisonCreds NUMERIC,
  electives NUMERIC,
  totalCreditHours NUMERIC,
  hasMinor BOOLEAN,
  PRIMARY KEY (major, degreeName)
);

DROP TABLE IF EXISTS minors;
CREATE TABLE minors(
  minor varchar(100) PRIMARY KEY,
  classCode VARCHAR(5),
  reqs JSONB,
  UpperDivisonCreds NUMERIC,
  majorElectives NUMERIC,
  totalCreditHours NUMERIC
);





