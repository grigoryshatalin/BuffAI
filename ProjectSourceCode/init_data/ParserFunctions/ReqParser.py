import re

def parse_requisites(description):
    """
    Parse the prerequisites from the course description.
    """
    prerequisites = [None] * 5 
    current_slot = 0
    courses_in_group = [] 

    # find the Requisites line
    for line in description.split("\n"):
        line = line.strip()
        if line.startswith("Requisites:"):
            # Remove unnecessary parts 
            clean_line = re.sub(r'(Requisites:|Requires|corequisite|prerequisite|minimum grade C-|\(all minimum grade of C-\)|\(minimum grade C-\))', '', line)

            # removing more parts 
            tokens = re.findall(r'[A-Z]{2,4} \d{4}|\band\b|\bor\b|\(', clean_line)  # find course IDs, ands, and ors
            while tokens and tokens[-1].lower() in ['and', 'or']:
                tokens.pop() # removes extranious 'and's and 'or's 
            tokens = [token for token in tokens if token not in ['(', ')']]

            prev_course = None  # to keep track of the previous course ID 
            prev_token = None  # to keep track of previous token

            tokenNum = 0
            
            for token in tokens:

                if re.match(r'[A-Z]{2,4} \d{4}', token):  # If token is a course ID


                    if token == tokens[-1]:
                        if prev_token == None:
                            prerequisites[current_slot] = token
                        if prev_token == 'or' :
                            courses_in_group.append(token)
                            prerequisites[current_slot] = courses_in_group
                            current_slot = current_slot + 1
                            courses_in_group = []
                            prev_token = None
                            prev_course = None

                    elif prev_token == None :
                        prev_course = token 

                    elif prev_token == 'or': 
                        courses_in_group.append(token)
                        if tokens[tokenNum+1] == 'and' :
                            prerequisites[current_slot] = courses_in_group
                            current_slot = current_slot + 1
                            courses_in_group = []
                            prev_token = None
                            prev_course = None
                        else:
                            prev_course = token 
            
                                                            #logic for sorting prerequisites 
                
                elif token.lower() == 'or':  
                    if tokens[-1] == token:
                        if prev_token == None:
                            if prev_course:
                                prerequisites[current_slot] = prev_course

                    if prev_token == 'or':
                        continue
                    elif prev_course:  
                        courses_in_group.append(prev_course)
                        prev_token = 'or'

                elif token.lower() == 'and':  
                    if prev_token == 'or':
                        continue

                tokenNum = tokenNum + 1
                
                if current_slot >= 5:
                    return prerequisites

    return prerequisites

def parse_courses(file_path):
    """
    Parse the course file to extract course names and prerequisites.
    """
    course_data = []
    
    with open(file_path, 'r') as file:
        lines = file.readlines()

    course_id = None
    description = []

    for line in lines:
        line = line.strip()

        if not line:
            continue
        
        # stores course ids 
        if re.match(r'[A-Z]{2,4} \d{4}', line):
            if course_id:  
                prerequisites = parse_requisites('\n'.join(description))
                course_data.append((course_id, prerequisites))

            # Reset for the new course
            course_id = line.split(" ")[0] + ' ' + line.split(" ")[1]  # extract course acronym and ID (PHYS 1120)
            description = [line]  
        else:
            description.append(line)

    #process the last course
    if course_id:
        prerequisites = parse_requisites('\n'.join(description))
        course_data.append((course_id, prerequisites))

    return course_data


def write_to_file(course_data, output_file):
    """
    Write the parsed course data to a file.
    """
    with open(output_file, 'w') as file:

        for course_id, prerequisites in course_data:

            prereqs = [str(prerequisite if prerequisite else "NULL") for prerequisite in prerequisites]
            file.write(f"({course_id}, {', '.join(prereqs)})\n")

if __name__ == "__main__":
    input_file = "ProjectSourceCode/init_data/dataLogs/courses.txt"
    output_file = "ProjectSourceCode/init_data/dataLogs/ParsedReq.txt"

    # Parse the courses and prerequisites
    course_data = parse_courses(input_file)

    # Write the output to a file
    write_to_file(course_data, output_file)

    print(f"Course prerequisites parsed and written to {output_file}")
