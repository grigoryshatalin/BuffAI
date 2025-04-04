INSERT INTO courses
  (course_id, course_name, credit_hours)
VALUES
  (1000, 'Computer Science as a Field of Work and Study', 1),
  (1300, 'Introduction to Programming', 4),
  (1200, 'Introduction to computational thinking', 3),
  (2270, 'Data Structures', 4),
  (2400, 'Computer Systems', 4),
  (3308, 'Software Development Methods and Tools', 3),
  (2824, 'Discrete Structures', 3),
  (3104, 'Algorithms', 4),
  (3155, 'Principles of Programming Languages', 4),
  (3287, 'Design and Analysis of Database systems', 3),
  (3753, 'Design and Analysis of Operating systems', 4),
  (2820, 'Linear Algebra with Computer Science Applications', 3),
  (3202, 'Introduction to Artificial Intelligence', 3),
  (3022, 'Introduction to Data Science', 3),
  (3002, 'Fundamentals of Human Computer Interaction', 4),
  (3010, 'Intensive Programming Workshop', 3),
  (4253, 'Data Center Scale Computing', 3),
  (4273, 'Network Systems', 3),
  (4308, 'Software Engineering Project 1', 4),
  (4448, 'Object-Oriented Analysis and Design', 3),
  (4502, 'Data Mining', 3);








INSERT INTO prerequisites
  (course_id, prerequisite_id)
VALUES
  (2270, 1300),
  (3308, 2270),
  (2824, 1300),
  (2400, 2270),
  (3104, 2270),
  (3104, 2824),
  (3155, 2270),
  (3155, 2824),
  (3287, 2270),
  (3753, 2270),
  (3753, 2400),
  (2820, 2270),
  (3202, 2270),
  (3202, 2824),
  (3202, 3022),
  (3022, 2270),
  (3022, 2824),
  (3002, 2270),
  (3010, 2270),
  (4253, 3753),
  (4273, 3753),
  (4308, 3308),
  (4448, 3308),
  (4502, 2270);