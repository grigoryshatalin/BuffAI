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
app.get('/home', (req, res) => {
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

  res.render('home', { title: 'Home'});
});

// Get request for logout page
app.get('/logout', (req, res) => {
  res.render('logout', { title: 'logout' });
});

// Get request for calendar
app.get('/calendar', (req, res) => {
  res.render('calendar', { title: 'calendar' });
});

//get request for the login page just to test
app.get('/login', (req, res) => 
{
  res.render('login');
});

//post request
app.post('/login', async (req, res) => {
  const { student_id, password } = req.body;

  try {
      const user = await db.oneOrNone('SELECT * FROM students WHERE student_id = $1', [student_id]);

      if (user && await bcrypt.compare(password, user.password)) 
        {
          req.session.user = user;
          res.redirect('/home');
      } 
      else 
      {
          res.render('login', { error: 'Invalid username or password' });
      }
  } 
  catch (error) 
  {
      console.error('Error during login:', error);
      res.render('login', { error: 'Something went wrong. Please try again.' });
  }
});

//testing
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

//get and post request for register page from the login page
app.get('/register', (req, res) => 
{
  res.render('register');
});

// Route to handle registration form submission (POST request)
app.post('/register', async (req, res) => {
  const{
    student_id,
    fullName,
    email,
    password,
    year,
    major,
    degree,
    minor
  } = req.body;

  if(
    !student_id ||
    !fullName ||
    !email ||
    !validator.isEmail(email) ||
    !password ||
    password.length < 6 ||
    !year ||
    !major ||
    !degree
  ){
    return res.status(400).render('register', {error: 'Please fill out all required fields correctly.'});
  }

  try{
    const validDegree = await db.oneOrNone(
      'SELECT 1 FROM degrees WHERE major = $1 AND degreeName = $2',
      [major, degree]
    );if(!validDegree){
      return res.status(400).render('register', {
        error: 'Selected degree does not exist for this major.'
      });
    }if(minor){
      const validMinor = await db.oneOrNone(
        'SELECT 1 FROM minors WHERE minor = $1',
        [minor]
      );if (!validMinor) {
        return res.status(400).render('register', {
          error: 'Selected minor does not exist.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.none(
      `INSERT INTO students (
        student_id, fullName, email, year, major, degree, minor, password
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [student_id, fullName, email, year, major, degree, minor || null, hashedPassword]
    );res.redirect('/login');
  }catch(error){
    console.error("Registration error:", error);
    res.status(500).render('register', {
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Route to interact with Ollama
let chatHistory = []; // per session — in-memory (could be user/session based)

app.use(express.json());

// ollama
app.post('/stream', async (req, res) => {
  const { prompt } = req.body;
  const chatHistory = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt }
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ollamaRes = await axios({
      method: 'post',
      url: 'http://ollama:11434/api/chat',
      responseType: 'stream',
      data: {
        model: 'gemma',
        messages: chatHistory,
        stream: true
      }
    });

    let assistantReply = '';

    ollamaRes.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const text = parsed.message?.content || parsed.response || '';
          assistantReply += text;
          res.write(text);
        } catch (err) {
          console.error('JSON parse error:', err);
        }
      }
    });

    ollamaRes.data.on('end', () => {
      res.end();
    });
  } catch (err) {
    console.error('Ollama error:', err.message);
    res.write(`ERROR: ${err.message}`);
    res.end();
  }
});

//Route to interact with Rate My Professor
app.use("/app", express.static(__dirname + "/app"));

//Maps route
const fs = require('fs');
app.get('/map', (req, res) => {
  const mapScript = fs.readFileSync(path.join(__dirname, 'public', 'map.js'), 'utf-8');
  res.render('map', { title: 'Campus Map', mapScript });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
