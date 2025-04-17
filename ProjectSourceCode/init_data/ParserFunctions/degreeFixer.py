import re

# Function to format the course codes inside the brackets
def format_courses(courses_str):
    # Match all occurrences of course codes and surround them with double quotes
    return re.sub(r'([A-Z]+\s?[0-9]+)', r'"\1"', courses_str)

# Function to process the file and adjust formatting
def process_file(input_file, output_file):
    with open(input_file, 'r') as infile, open(output_file, 'w') as outfile:
        for line in infile:
            # Match the structure containing the outermost brackets and courses inside
            match = re.match(r"\('([^']+)', '([^']+)', '([^']+)', (\[\[.*\]\]), (\d+), (\d+), (\d+), (TRUE|FALSE)\),", line.strip())
            if not match:
                # Adjusting regex to handle courses without quotes inside brackets
                match = re.match(r"\('([^']+)', '([^']+)', '([^']+)', (\[[^\]]*\]), (\d+), (\d+), (\d+), (TRUE|FALSE)\),", line.strip())
                
            if match:
                major_name = match.group(1)
                department_code = match.group(2)
                reqs = format_courses(match.group(4))  # Format the course list into proper syntax
                upper_credits = match.group(5)
                electives = match.group(6)
                total_credits = match.group(7)
                is_active = match.group(8)

                # Surround the outermost bracket with single quotes
                formatted_reqs = f"'{reqs}'"
                
                # Prepare the formatted line (without the 'INSERT INTO' part)
                formatted_line = f"('{major_name}', '{department_code}', {formatted_reqs}, {upper_credits}, {electives}, {total_credits}, {is_active}),\n"
                outfile.write(formatted_line)

# Specify the input and output file paths
input_file = 'init_data/dataLogs/sample.txt'  # The path to your input .txt file
output_file = 'init_data/dataLogs/parsedDegree.txt'  # The path to save the formatted data

# Call the function to process the file
process_file(input_file, output_file)
