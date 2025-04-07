const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // Used to call Ollama API

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

//get and post request for register page from the login page
app.get('/register', (req, res) => 
{
  res.render('register');
});

// Route to handle registration form submission (POST request)
app.post('/register', async (req, res) => {
  const { name, year, major, minor, interests } = req.body;
  //Save until database is more flushed out
  try {
      await db.none('INSERT INTO users(name, year, major, minor, interests) VALUES($1, $2, $3, $4, $5)', [name, year, major, minor, interests]);
      res.redirect('/login');
  } catch (error) {
      console.error("Error during registration:", error);
      res.render('register', { error: 'An error occurred. Please try again.' });
  }
});

// Route to interact with Ollama
app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post('http://ollama:11434/api/chat', {
      model: 'gemma3:1b',
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    });

    const responseContent = response.data.message?.content || 'No response received';
    res.json({ response: responseContent });
  } catch (error) {
    console.error('Error communicating with Ollama:', error.message);
    
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    res.status(500).json({ error: 'Failed to communicate with Ollama', details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


