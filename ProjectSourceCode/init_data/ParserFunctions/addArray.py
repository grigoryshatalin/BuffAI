def add_array_to_lists(input_file, output_file="ProjectSourceCode/init_data/dataLogs/reqinsert.txt"):
    updated_lines = []
    
    # Read the input file line by line
    with open(input_file, 'r') as file:
        for line in file:
            # Strip leading/trailing whitespace
            line = line.strip()
            
            # If line contains a list, add 'ARRAY' in front of it
            if '[' in line:
                line = line.replace('[', 'ARRAY[')

            if not line.strip().endswith(','):
                line = line.strip() + ','

            updated_lines.append(line)
    
    # Write the updated lines to the output file
    with open(output_file, 'w') as out_file:
        for line in updated_lines:
            out_file.write(f"{line}\n")


add_array_to_lists("ProjectSourceCode/init_data/dataLogs/ParsedReq.txt")