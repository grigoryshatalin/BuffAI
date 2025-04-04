import re

def parse_courses(input_file, output_file):
    courses = []
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    course_pattern = re.compile(r"([A-Z]+) (\d+) \((\d+)(?:-\d+)?\) (.+)")
    major_pattern = re.compile(r"Restricted to .*?\((\w+)\) majors")

    course_number, course_name, credit_hours, specific_major = None, None, None, None

    for line in lines:
        line = line.strip()

        # Check if this line contains a course entry
        course_match = course_pattern.match(line)
        if course_match:
            # Save previous course if it exists
            if course_number:
                courses.append((course_number, course_name, credit_hours, specific_major))

            # Extract new course data
            course_number = int(course_match.group(2))  # Course number
            credit_hours = int(course_match.group(3))   # Credit hours (use lower if range)
            course_name = course_match.group(4)         # Course name
            specific_major = None  # Reset major

        # Check if this line contains a major restriction
        major_match = major_pattern.search(line)
        if major_match:
            specific_major = major_match.group(1)

    # Add last parsed course
    if course_number:
        courses.append((course_number, course_name, credit_hours, specific_major))

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        for course in courses:
            major = f"'{course[3]}'" if course[3] else 'NULL'  # Avoid nested f-string
            f.write(f"({course[0]}, '{course[1]}', {course[2]}, {major}),\n")

# Run the parser

parse_courses("ProjectSourceCode/init_data/courses.txt", "ProjectSourceCode/init_data/sampleCourses.txt")
