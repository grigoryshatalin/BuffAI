import re

def extract_course_ids(file_path):
    course_groups = []
    current_group = []
    current_and_group = None
    last_course = None

    def flush_and_group():
        nonlocal current_and_group
        if current_and_group:
            current_group.append(current_and_group)
            current_and_group = None

    def flush_current_group():
        nonlocal current_group
        flush_and_group()
        if current_group:
            if len(current_group) == 1:
                course_groups.append(current_group[0])
            else:
                course_groups.append(current_group)
            current_group = []

    with open(file_path, 'r') as file:
        for line in file:
            line = line.strip()
            if not line:
                continue

            match = re.match(r'(?:or |& )?([A-Z]{2,4} \d{4})', line)
            if not match:
                continue

            course_id = match.group(1)

            if line.startswith("& "):
                if current_and_group is None:
                    if current_group and current_group[-1] == last_course:
                        current_group.pop()
                    current_and_group = [last_course, course_id]
                else:
                    current_and_group.append(course_id)
            elif line.startswith("or "):
                flush_and_group()
                current_group.append(course_id)
                last_course = course_id
            else:
                flush_current_group()
                current_group = [course_id]
                last_course = course_id
                current_and_group = None

    flush_current_group()

    def format_group(group):
        if isinstance(group, list):
            return '[' + ', '.join(format_group(g) for g in group) + ']'
        else:
            return group

    return ', '.join(format_group(group) for group in course_groups)


updated_lines = extract_course_ids("ProjectSourceCode/init_data/dataLogs/sample.txt")

with open("ProjectSourceCode/init_data/dataLogs/parsedDegree.txt", 'w') as out_file:
    out_file.write(f"{updated_lines}\n")