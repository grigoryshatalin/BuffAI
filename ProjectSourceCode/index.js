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


//get request for the login page just to test
app.get('/login', (req, res) => 
{
  res.render('login');
});
//post request
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

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
  const {
    first_name,
    last_name,
    email,
    password,
    year,
    major,
    degree
  } = req.body;

  // ✅ Simple validation logic
  if (
    !first_name ||
    !last_name ||
    !email ||
    !validator.isEmail(email) ||
    !password ||
    password.length < 6 || // minimum length check (you can change this)
    !year ||
    !major ||
    !degree
  ) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    await db.none(
      `INSERT INTO students (
        first_name, last_name, email, password, year, major, degree
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [first_name, last_name, email, password, year, major, degree]
    );

    res.redirect('/login');
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});



// Route to interact with Ollama
let chatHistory = []; // per session — in-memory (could be user/session based)

app.use(express.json());

// index.js
app.post('/stream', async (req, res) => {
  const { prompt } = req.body;
  chatHistory.push({ role: 'user', content: prompt });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
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

    let assistantReply = '';

    ollamaRes.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const text = parsed.message?.content || parsed.response || '';
          assistantReply += text;
          res.write(text); // no `data:`, just raw text
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      }
    });

    ollamaRes.data.on('end', () => {
      chatHistory.push({ role: 'assistant', content: assistantReply });
      res.end();
    });
  } catch (err) {
    res.write(`ERROR: ${err.message}`);
    res.end();
  }
});



const PORT = process.env.PORT || 3000;
module.exports = app.listen(3000);
console.log(`Server running on http://localhost:${PORT}`);
// Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });


