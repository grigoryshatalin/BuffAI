require('dotenv').config();
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // Used to call Ollama API
const validator = require('validator'); // run `npm install validator` if not installed
const { Readable } = require('stream');
// ollama
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

app.use(session({
  secret: 'mySecret123',
  resave: false,
  saveUninitialized: false
}));

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'db', // Use 'db' for Docker Compose
  port: process.env.DB_PORT || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done();
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// Set up Handlebars view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views/pages')); // This points to the 'pages' folder

// Middleware setup
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Allow JSON body parsing

// Route to render testing.hbs
app.get('/', (req, res) => {
  res.render('testing', { response: null }); // Pass empty response initially
});


// route to render home.hbs
app.get('/home', async (req, res) => {
  //queries
  //db.any(all_students, [req.session.user.student_id])
  //.then(courses => {
  //  console.log(courses)
  //  res.render('pages/courses', {
  //  email: user.email,
  //  courses,
  //  action: req.query.taken ? 'delete' : 'add',
  // });

  //  })
  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }

  const student = req.session.user;
  const added = req.query.added;
  const message = req.query.message;

  let courses = [];

  if (student) {
    try {
      courses =  await db.any(`
        SELECT c.course_id, c.course_name
        FROM student_courses sc
        JOIN courses c ON sc.course_id = c.course_id
        WHERE sc.student_id = $1
      `, [student.student_id]);
    } catch (err) {
      console.error('Error fetching student courses:', err);
    }
  }

  res.render('home', { title: 'Home', added, message, courses });
});

app.post('/remove-class', async (req, res) => {
  const student = req.session.user;
  const { course_id } = req.body;

  if (!student || !course_id) {
    return res.redirect('/home?message=Missing+info');
  }

  try {
    await db.none(
      `DELETE FROM student_courses WHERE student_id = $1 AND course_id = $2`,
      [student.student_id, course_id]
    );
    res.redirect('/home?message=Removed+course+' + encodeURIComponent(course_id));
  } catch (err) {
    console.error('Failed to remove class:', err);
    res.redirect('/home?message=Failed+to+remove+course');
  }
});



app.get('/hobbies', (req, res) => {

  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }

  res.render('hobbies', { title: 'Hobbies and Interests' });
});


app.get('/rate-my-professor', (req, res) => {

  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }

  res.render('rate-my-professor', { title: 'Rate My Professor' });
});

app.post('/add-class', async (req, res) => {
  const student = req.session.user;
  const { course_id } = req.body;

  if (!student || !course_id) {
    return res.redirect('/home?message=Missing%20student%20or%20course%20ID');
  }

  try {
    // Validate course
    const course = await db.oneOrNone('SELECT course_id FROM courses WHERE course_id = $1', [course_id]);

    if (!course) {
      return res.redirect('/home?message=Invalid%20course%20code');
    }

    // Insert only if not already taken
    await db.none(`
      INSERT INTO student_courses (course_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [course_id, student.student_id]);

    res.redirect(`/home?added=${encodeURIComponent(course_id)}`);
  } catch (err) {
    console.error('Error adding class:', err);
    res.redirect('/home?message=Something%20went%20wrong');
  }
});





// Get request for logout page
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Could not log out. Please try again.');
    }
    res.clearCookie('connect.sid'); // optional: explicitly clear the session cookie
    res.redirect('/login'); // or wherever you want to redirect after logout
  });
});


// Get request for calendar
app.get('/calendar', (req, res) => {
  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }
  res.render('calendar', { title: 'calendar' });
});

//get request for the login page just to test
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.render('home', {
      title: 'Home',
      message: 'You are already logged in!'
    });
  }

  res.render('login');
});

//post request
app.post('/login', async (req, res) => {
  const { student_id, password } = req.body;
  console.log('Login attempt:', student_id, password);

  try {
    const user = await db.oneOrNone('SELECT * FROM students WHERE student_id = $1', [student_id]);
    console.log('Found user:', user);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      res.redirect('/home');
    }
    else {
      res.render('login', { error: 'Invalid username or password' });
    }
  }
  catch (error) {
    console.error('Error during login:', error);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

//testing
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

//get and post request for register page from the login page
app.get('/register', (req, res) => {
  res.render('register');
});

// Route to handle registration form submission (POST request)
app.post('/register', async (req, res) => {
  const {
    student_id,
    fullName,
    email,
    password,
    year,
    major,
    degree,
    minor
  } = req.body;
  console.log('Register body:', req.body);
  if (
    !student_id ||
    !fullName ||
    !email ||
    !validator.isEmail(email) ||
    !password ||
    password.length < 6 ||
    !year ||
    !major ||
    !degree
  ) {
    return res.status(400).render('register', { error: 'Please fill out all required fields correctly.' });
  }
  try {
    const validDegree = await db.oneOrNone(
      'SELECT 1 FROM degrees WHERE major = $1 AND degreeName = $2',
      [major, degree]
    ); if (!validDegree) {
      return res.status(400).render('register', {
        error: 'Selected degree does not exist for this major.'
      });
    } if (minor) {
      const validMinor = await db.oneOrNone(
        'SELECT 1 FROM minors WHERE minor = $1',
        [minor]
      ); if (!validMinor) {
        return res.status(400).render('register', {
          error: 'Selected minor does not exist.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword); // should start with $2a$ or $2b$
    console.log('Registered user with student_id:', student_id);
    const testUser = await db.oneOrNone('SELECT * FROM students WHERE student_id = $1', [student_id]);
    console.log('After register, found test user:', testUser);

    await db.none(
      `INSERT INTO students (
        student_id, fullName, email, year, major, degree, minor, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [student_id, fullName, email, year, major, degree, minor || null, hashedPassword]
    ); res.redirect('/login');
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).render('register', {
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Route to interact with Ollama
let chatHistory = []; // per session — in-memory (could be user/session based)

app.use(express.json());

app.post('/stream', async (req, res) => {
  const { prompt } = req.body;
  const student = req.session.user;

  let studentInfo = '';
  let formattedReqs = 'Degree requirements could not be loaded.';
  let courseListText = 'No courses added.';

  try {
    const result = await db.one(`
      SELECT 
        s.fullName, s.email, s.year, s.major, s.degree, s.minor,
        d.reqs, d.totalCreditHours, d.electives, d.UpperDivisonCreds, d.hasMinor
      FROM students s
      JOIN degrees d ON s.major = d.major AND s.degree = d.degreeName
      WHERE s.student_id = $1
    `, [student.student_id]);

    const requirements = Array.isArray(result.reqs) ? result.reqs : JSON.parse(result.reqs);
    const allCourses = await db.any('SELECT course_id, course_name FROM courses');
    const courseMap = Object.fromEntries(allCourses.map(c => [c.course_id, c.course_name]));

    // Get current courses taken by the student
    const takenCourses = await db.any(`
      SELECT c.course_id, c.course_name
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      WHERE sc.student_id = $1
    `, [student.student_id]);

    if (takenCourses.length > 0) {
      courseListText = takenCourses.map(c => `- ${c.course_id}: ${c.course_name}`).join('\n');
    }

    formattedReqs = requirements.map((req, i) => {
      if (Array.isArray(req)) {
        const options = req.map(code => {
          const title = courseMap[code] || 'UNKNOWN';
          return `${code}: ${title}`;
        });
        return `Requirement ${i + 1}: ONE OF → ${options.join(', ')}`;
      } else {
        const title = courseMap[req] || 'UNKNOWN';
        return `Requirement ${i + 1}: ${req}: ${title}`;
      }
    }).join('\n');

    studentInfo = `
STUDENT PROFILE
---------------
Name: ${result.fullName}
Email: ${result.email}
Year: ${result.year}
Major: ${result.major}
Degree: ${result.degree}
Minor: ${result.minor || 'None'}

DEGREE REQUIREMENTS
-------------------
Total Credit Hours: ${result.totalcredithours}
Electives: ${result.electives}
Upper Division Credits Required: ${result.upperdivisoncreds}
Minor Required: ${result.hasminor ? 'Yes' : 'No'}

COURSE REQUIREMENTS
-------------------
(All required unless marked as "one of")

${formattedReqs}

CURRENTLY ADDED COURSES
-----------------------
${courseListText}
`;

  } catch (err) {
    console.error('Failed to fetch student data:', err);
    studentInfo = "The student's data could not be retrieved.";
  }

  const chatHistory = [
    {
      role: 'system',
      content: `
You are a helpful college advisor AI assistant.

The student is already authenticated. You are allowed to reference their profile.

Here is their profile:

${studentInfo}

You may directly answer questions like "what is my major" or "do I have a minor?".
Do not say you cannot access their data.

⚠️ Important Instructions:
- You are explicitly allowed to refer to the student's name, email, major, year, degree, minor, current coursework, and requirements.
- If the user asks questions like "what is my major" or "what courses have I taken?", answer directly from the provided data.
- Do NOT respond with "I cannot access that" or "I don't know your personal info." You already have it.
- If a field is missing or null (e.g., no minor), respond accordingly (e.g., "You have no minor declared").

Degree requirements format:
- Outer list = **AND** conditions (all must be satisfied).
- Inner list = **OR** choices (choose one).

Do not list every requirement unless asked.
Begin responding to the user’s question below.
      `
    },
    {
      role: 'user',
      content: prompt
    }
  ];


  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(__dirname, `chat-${timestamp}.txt`);
  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(`User: ${prompt}\nAssistant: `);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const fullPromptLog = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
    fs.writeFileSync(`full-prompt-${timestamp}.txt`, fullPromptLog);
    const ollamaRes = await axios({
      method: 'post',
      url: 'http://ollama:11434/api/chat',
      responseType: 'stream',
      data: {
        model: 'gemma3:1b',
        messages: chatHistory,
        stream: true
      }
    });

    ollamaRes.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const text = parsed.message?.content || parsed.response || '';
          res.write(text);
          writeStream.write(text);
        } catch (err) {
          console.error('JSON parse error:', err);
        }
      }
    });

    ollamaRes.data.on('end', () => {
      writeStream.end('\n\n');
      res.end();
    });
  } catch (err) {
    console.error('Ollama error:', err.message);
    writeStream.end();
    res.write(`ERROR: ${err.message}`);
    res.end();
  }
});


//Route to interact with Rate My Professor
app.use("/app", express.static(__dirname + "/app"));

//Maps route
app.get('/map', (req, res) => {
  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }
  const mapScript = fs.readFileSync(path.join(__dirname, 'public', 'map.js'), 'utf-8');
  res.render('map', { title: 'Campus Map', mapScript });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
