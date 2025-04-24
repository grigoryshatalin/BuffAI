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

// Filter courses by year
hbs.handlebars.registerHelper('filterCourses', function(courses, year) {
  return courses.filter(course => course.year === year);
});

// Capitalize first letter
hbs.handlebars.registerHelper('capitalize', function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// Allow temporary binding (like `let`)
hbs.handlebars.registerHelper('let', function(value, options) {
  return options.fn(value);
});

hbs.handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

hbs.handlebars.registerHelper('array', function (...args) {
  return args.slice(0, -1);
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
app.use(express.static(path.join(__dirname, 'app')));
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Allow JSON body parsing


//change it so it shows the login screen first
app.get('/', (req, res) => {
  res.render('login', { title: 'login', formaat: 'main', showNav: false }); // Pass empty response initially
});


// route to render home.hbs
app.get('/home', async (req, res) => {
  if (!req.session.user) {
    return res.render('login', {
      title: 'Login',
      message: 'You are not logged in!'
    });
  }

  const student = req.session.user;
  const added = req.query.added;
  const message = req.query.message;
  const yearLabels = ['freshman', 'sophomore', 'junior', 'senior'];


  let courses = [];
  let hobbies = [];
  let studentYear = '';
  let coursesByYear = {
    freshman: [],
    sophomore: [],
    junior: [],
    senior: [],
  };

  try {
    // Query for courses
    courses = await db.any(`
      SELECT c.course_id, c.course_name, sc.year
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.course_id
      WHERE sc.student_id = $1
    `, [student.student_id]);

    // Organize courses by year
    courses.forEach(course => {
      switch (course.year) {
        case 'freshman':
          coursesByYear.freshman.push(course);
          break;
        case 'sophomore':
          coursesByYear.sophomore.push(course);
          break;
        case 'junior':
          coursesByYear.junior.push(course);
          break;
        case 'senior':
          coursesByYear.senior.push(course);
          break;
        default:
          break;
      }
    });

    // Query for hobbies
    hobbies = await db.any(`
      SELECT hobby FROM student_hobbies WHERE student_id = $1
    `, [student.student_id]);

    // Query for student's year from the students table
    const studentResult = await db.one(`
      SELECT year FROM students WHERE student_id = $1
    `, [student.student_id]);

    studentYear = studentResult.year;

  } catch (err) {
    console.error('Error loading student info:', err);
  }

  // Render the home page with courses organized by year
  res.render('home', {
    title: 'Home',
    added,
    message,
    coursesByYear,
    yearLabels,  // Passing the courses grouped by year
    hobbies,
    studentYear,
    layout: 'main',
    showNav: true
  });
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

  res.render('hobbies', { title: 'Hobbies and Interests', layout: 'main', showNav: true });
});


//rate my professor and map get and post here
// GET map.html
app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'map.html'));
});

// POST map.html (example form submission)
app.post('/map', (req, res) => {
  // handle form data or actions here
  res.send('Map POST received');
});

// GET rmp.html
app.get('/rmp', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'rmp.html'));
});

// POST rmp.html (example form submission)
app.post('/rmp', (req, res) => {
  // handle form data or actions here
  res.send('RMP POST received');
});


app.post('/add-class', async (req, res) => {
  const student = req.session.user;
  const { course_id, year } = req.body;

  if (!student || !course_id) {
    return res.redirect('/home?message=Missing%20student%20or%20course%20ID');
  }

  try {
    const course = await db.oneOrNone('SELECT course_id FROM courses WHERE course_id = $1', [course_id]);

    if (!course) {
      return res.redirect('/home?message=Invalid%20course%20code');
    }

    await db.none(`
      INSERT INTO student_courses (course_id, student_id, year)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [course_id, student.student_id, year]);

    res.redirect(`/home?added=${encodeURIComponent(course_id)}`);
  } catch (err) {
    console.error('Error adding class:', err);
    res.redirect('/home?message=Something%20went%20wrong');
  }
});

// Add hobby
app.post('/add-hobby', async (req, res) => {
  const student = req.session.user;
  const { hobby } = req.body;

  if (!student || !hobby) return res.redirect('/home?message=Missing+info');

  try {
    await db.none(`
      INSERT INTO student_hobbies (student_id, hobby)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [student.student_id, hobby]);
    res.redirect(`/home?added=${encodeURIComponent(hobby)}`);
  } catch (err) {
    console.error('Error adding hobby:', err);
    res.redirect('/home?message=Could+not+add+hobby');
  }
});

// Remove hobby
app.post('/remove-hobby', async (req, res) => {
  const student = req.session.user;
  const { hobby } = req.body;

  if (!student || !hobby) return res.redirect('/home?message=Missing+info');

  try {
    await db.none(
      `DELETE FROM student_hobbies WHERE student_id = $1 AND hobby = $2`,
      [student.student_id, hobby]
    );
    res.redirect('/home?message=Removed+hobby');
  } catch (err) {
    console.error('Failed to remove hobby:', err);
    res.redirect('/home?message=Error+removing+hobby');
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

//testing
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

//get and post request for register page from the login page
// GET register
app.get('/register', (req, res) => {
  res.render('register', { title: 'Register', layout: 'main', showNav: false });
});

// POST register
app.post('/register', async (req, res) => {
  let {
    student_id,
    fullName,
    email,
    password,
    year,
    major,
    degree,
    minor
  } = req.body;

  // Convert student_id to integer
  student_id = parseInt(student_id, 10);
  if (isNaN(student_id)) {
    return res.status(400).render('register', {
      error: 'Student ID must be a number.',
      layout: 'main',
      showNav: false
    });
  }

  console.log('Register body:', req.body);

  if (
    !student_id ||
    !fullName ||
    !email || !validator.isEmail(email) ||
    !password || password.length < 6 ||
    !year || !major || !degree
  ) {
    return res.status(400).render('register', {
      error: 'Please fill out all required fields correctly.',
      layout: 'main',
      showNav: false
    });
  }

  try {
    const existing = await db.oneOrNone('SELECT 1 FROM students WHERE student_id = $1', [student_id]);
    if (existing) {
      return res.status(400).render('register', {
        error: 'A student with that ID already exists.',
        layout: 'main',
        showNav: false
      });
    }

    const validDegree = await db.oneOrNone(
      'SELECT 1 FROM degrees WHERE major = $1 AND degreeName = $2',
      [major, degree]
    );
    if (!validDegree) {
      return res.status(400).render('register', {
        error: 'Selected degree does not exist for this major.',
        layout: 'main',
        showNav: false
      });
    }

    if (minor) {
      const validMinor = await db.oneOrNone('SELECT 1 FROM minors WHERE minor = $1', [minor]);
      if (!validMinor) {
        return res.status(400).render('register', {
          error: 'Selected minor does not exist.',
          layout: 'main',
          showNav: false
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.none(
      `INSERT INTO students (
        student_id, fullName, email, year, major, degree, minor, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [student_id, fullName, email, year, major, degree, minor || null, hashedPassword]
    );

    console.log(`✅ Registered student: ${student_id}`);
    res.redirect('/login');
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).render('register', {
      error: 'Something went wrong. Please try again.',
      layout: 'main',
      showNav: false
    });
  }
});

// GET login
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.render('home', {
      title: 'Home',
      message: 'You are already logged in!'
    });
  }

  res.render('login');
});

// POST login
app.post('/login', async (req, res) => {
  let { student_id, password } = req.body;
  student_id = parseInt(student_id, 10);

  console.log('Login attempt:', student_id, password);

  if (isNaN(student_id)) {
    return res.render('login', { error: 'Student ID must be a number' });
  }

  try {
    const user = await db.oneOrNone('SELECT * FROM students WHERE student_id = $1', [student_id]);
    console.log('Found user:', user);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      res.redirect('/home');
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});




app.get('/advisor', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.render('advisor', {
    title: 'AI Advisor',
    layout: 'main',
    showNav: true
  });
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
  let hobbyListText = 'No hobbies listed.';

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

    // Get courses
    const takenCourses = await db.any(`
    SELECT c.course_id, c.course_name
    FROM student_courses sc
    JOIN courses c ON sc.course_id = c.course_id
    WHERE sc.student_id = $1
  `, [student.student_id]);

    if (takenCourses.length > 0) {
      courseListText = takenCourses.map(c => `- ${c.course_id}: ${c.course_name}`).join('\n');
    }

    // Get hobbies
    const hobbies = await db.any(`
    SELECT hobby FROM student_hobbies WHERE student_id = $1
  `, [student.student_id]);

    if (hobbies.length > 0) {
      hobbyListText = hobbies.map(h => `- ${h.hobby}`).join('\n');
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

HOBBIES & INTERESTS
-------------------
${hobbyListText}
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

You may directly answer questions like "what is my major", "what classes have I taken", or "what are my hobbies?".
Do not say you cannot access their data.

⚠️ Important Instructions:
- You are explicitly allowed to refer to the student's name, email, major, year, degree, minor, courses, hobbies, and requirements.
- If the user asks questions like "what are my interests?" or "what are my current classes?", respond from the provided data.
- Do NOT say \"I don’t know your profile\" — you already have it.
- If a field is missing or null (e.g., no minor), respond accordingly.

Degree requirements format:
- Outer list = **AND** conditions
- Inner list = **OR** options

Respond thoughtfully. Begin below.
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
