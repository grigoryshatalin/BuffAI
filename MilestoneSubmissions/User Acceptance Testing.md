# Team Ollama – Test Plan Document

**Team Members:**
- Alex Johnson (Frontend)
- Grigory Sharapov (Backend/API Integration)
- Priya Mehta (Testing Lead)

**Project Name:** SmartEdu Assistant

---

## Feature 1: Ollama Chat Response (AI Messaging)

### Description
This feature enables users to send messages to the Ollama LLM-based API and receive AI-generated responses in a chatbot interface.

### Test Environment
- **Environment:** Localhost (`http://localhost:3000`)
- **Server Runtime:** Node.js v22
- **Frontend Framework:** React
- **Test Tools:** Postman, Jest

### Test Data
- Any string message, such as `"Hello"` or `"What is stress?"`

### Test Cases
| Test ID | Test Description                            | Input Message         | Expected Result                      |
|---------|---------------------------------------------|-----------------------|--------------------------------------|
| TC001   | Verify Ollama sends any response            | "Hello"               | Non-empty response from the API      |
| TC002   | Verify response format                      | "Test message"        | JSON with `message` or `text` field |
| TC003   | Verify error on empty input                 | ""                    | Error message or validation warning  |

### Testers
- Priya Mehta (QA)
- Grace Chen (Beta tester from LWTech's Psychology Club)

### Test Results
- TC001: ✅ Response received: `"Hi, how can I help you today?"`
- TC002: ✅ API responded with valid JSON structure
- TC003: ✅ Proper validation error shown in UI

---

## Feature 2: Google Maps Directions Between Two Locations

### Description
This feature shows a route between two user-inputted locations using the Google Maps API.

### Test Environment
- **Environment:** Deployed cloud version on Vercel (`https://smartedu.vercel.app`)
- **Test Tools:** Cypress for UI test, manual browser testing

### Test Data
- Origin: "Lake Washington Institute of Technology"
- Destination: "University of Washington Seattle"

### Test Cases
| Test ID | Test Description                        | Input                          | Expected Result                                         |
|---------|-----------------------------------------|--------------------------------|--------------------------------------------------------|
| TC004   | Show route on map between two locations | Valid origin and destination   | Route drawn on map with time & distance info shown     |
| TC005   | Handle invalid location input           | "Xyzabc123" to "Seattle"       | Show "Location not found" or graceful fallback         |
| TC006   | Directions with real-time traffic       | Same as TC004 during rush hour | Slightly altered route with live traffic considerations|

### Testers
- Alex Johnson (Frontend QA)
- Student volunteers from LWTech Computer Science Club

### Test Results
- TC004: ✅ Route rendered in ~3 seconds, accurate path.
- TC005: ✅ Error message: "Please enter a valid location."
- TC006: ✅ Route showed traffic adjustment near I-5.

---

## Feature 3: Rate My Professor API Integration

### Description
Allows users to search for and display information about professors based on college and professor name, using Rate My Professor's unofficial API.

### Test Environment
- **Environment:** Localhost and Vercel production
- **Test Tools:** Postman for API testing, Browser console for network

### Test Data
- Professor: "John Smith"
- School: "University of Washington"

### Test Cases
| Test ID | Test Description                     | Input                             | Expected Output                                      |
|---------|--------------------------------------|-----------------------------------|------------------------------------------------------|
| TC007   | API returns professor information    | "John Smith", "University of WA" | JSON object with rating, department, and reviews     |
| TC008   | API handles unknown professor input  | "DoesNotExist", "UW"             | JSON response: `{ error: "Not found" }`              |
| TC009   | Test API latency                     | Multiple valid queries            | All responses < 1.2s                                 |

### Testers
- Grigory Sharapov (Backend QA)
- Beta testers from CS department

### Test Results
- TC007: ✅ Response returned professor rating = 4.5, 20 reviews.
- TC008: ✅ API returned `{ error: "Not found" }` as expected.
- TC009: ✅ All queries responded in under 900ms.

---

## Summary

All critical features passed functional and user acceptance tests. Minor styling tweaks for map labels were noted but not functional blockers. Full results will be appended in the final project report.
