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
                                                          
### Test Results

Test ID: TC001
Result: Inputting “Hello” does yield a nonempty response from the AI chatbot. It answer may vary depending on when you say it in the course of the conversation, but it does response with a sensical response to “hello”. 

Test ID: TC002
Result: The AI does not return a CSV file or any type of file for it to load up an example degree plan.  We were not able to develop that functionality, but the AI does successfully recognize majors and minors input during registration and also knows what classes you have inserted yourself in your degree plan from the homepage. If you ask it to recommend more classes you have to take in your degree, it will do so, but will not give correct answers.  It would take a better LLM to be capable of doing this. 




### Testers
- Spencer
- James


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
|---------|-----------------------------------------|---------------------------------------|----------------------------------------------------|
| TC003   | Show route on map between two locations |User input valid origin and destination| Route drawn on map with time & distance info shown |
| TC004   | Handle invalid location input           | "Xyzabc123" to "Seattle"              | Show "invalid input" message                       |
| TC005   | Take in user input fields               | Same as TC00p3                        | "Search" button changes color and allows you to    |
            of origin and desination                                                           inquire the google maps API

### Test Results

Test ID: TC003
Result: The map shows directions between 2 locations if they are valid input origins and destinations on campus. The map window will show a suggested route between the two locations and will give distance and transit time information. 

Test ID: TC004
Result: Does not display any sort of warning. Instead, when you’re typing it shows you the list of most similar valid locations to prevent that in the first place.  You must actually click on a valid location so that it recognizes the location as being valid before submitting it. 

Test ID: TC005
Result: Takes user input fields if they’re valid Google Maps locations. You are able to either input them in search bars for an origin and destination or click the map and place two pins. Either one will route an appropriate path.  



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
                
### Test Results 

Test ID: TC006
Result: API mimic returns professor ratings.  The return is the top result from Rate My Professor.  The professor’s name, rating, and department are returned.  The number of reviews is returned, but since there are usually multiple reviews we decided to not return any specific review. 

Test ID: TC007
Result: Does not return an error, instead returns the most similar professor just like the Rate My Professor website. It is up to the user to determine whether or not this was the professor they were actually looking for. 



### Testers
- James


