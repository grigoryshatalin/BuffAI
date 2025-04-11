# Team BuffAI – Test Plan Document

**Team Members:**
- Greg (Team Lead)
- James
- Ari
- Spencer
- Marcus 

**Project Name:** BuffAI

---

## Feature 1: Ollama Chat Response and Class Planning (AI Messaging)

### Description
This feature enables users to send messages to the Ollama LLM-based API and receive AI-generated responses in a chatbot interface. Ollama API will also be used in formulating a general degree plan based on your major and minor. 

### Test Environment
- **Environment:** Localhost (`http://localhost:3000`)


### Test Data
- Any string message, such as `"Hello"` or `"What is stress?"`
- User input data about their year, major, and minor from a dropdown list in the registration page

### Test Cases
| Test ID | Test Description                            | Input                                | Expected Result        |
|---------|---------------------------------------------|-------------------------------      -|------------------------|
| TC001   | Verify Ollama sends any response            | "Hello"                              | Non-empty response from the API|
| TC002   | Verify Ollama's degree planning ability     | Information from registration fields | A CSV file of of classes organized b                                                         of Year, Major, and Minor               by year you must take them to complete your degreee
                                                          


### Testers
- Spencer
- Greg


## Feature 2: Google Maps Directions Between Two Locations

### Description
This feature shows a route between two user-inputted locations using the Google Maps API.

### Test Environment
- **Environment:** Localhost (`http://localhost:3000`)

### Test Data
- Origin on CU's Campus
- Destination of CU's Campus

### Test Cases
| Test ID | Test Description                        | Input                                 | Expected Result                                        |
|---------|-----------------------------------------|---------------------------------------|--------------------------------              ----------|
| TC003   | Show route on map between two locations | User input alid origin and destination| Route drawn on map with time & distance info shown     |
| TC004   | Handle invalid location input           | "Xyzabc123" to "Seattle"              | Show "invalid input" message                           |
| TC005   | Take in user input fields               | Same as TC00p3                        | "Search" button changes color and allows you to        |
            of origin and desination                                                           inquire the google maps API

### Testers
- Ari
- Spencer
- James



## Feature 3: Rate My Professor API Integration

### Description
Allows users to search for and display information about professors based on college and professor name, using Rate My Professor's unofficial API.

### Test Environment
- **Environment:** Localhost (`http://localhost:3000`)

### Test Data
- User input professor Name
- User input class name or class code


### Test Cases
| Test ID | Test Description                     | Input                               | Expected Output                                      |
|---------|--------------------------------------|-----------------------------------  |------------------------------------------------------|
| TC006   | API returns professor ratings        | Valid Professor Name, Class name    | JSON object with rating, department, and reviews     |
| TC007   | API handles unknown professor input  | Invalid/nonexistent professor/class | JSON response: `{ error: "Not found" }`              |
                

### Testers
- Marcus
- James


