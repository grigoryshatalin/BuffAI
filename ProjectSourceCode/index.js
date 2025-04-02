const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios'); // Used to call Ollama API
const ollama = require('ollama'); // CommonJS style import

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

// Route to handle Ollama API request
// Route to handle Ollama API request
app.post('/generate', async (req, res) => {
  const { prompt } = req.body; // Extract user input

  try {
    const url = 'http://localhost:11434/api/generate';
    const data = {
      model: 'gemma3',
      prompt: prompt,
      stream: false // Set to true for streaming responses
    };

    // Use axios instead of fetch
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Check for successful response
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(response.data.response);
    res.render('testing', { response: response.data.response }); // Send response back
  } catch (error) {
    console.error("Error fetching Ollama response:", error);
    res.render('testing', { response: "Error generating response. Please try again." });
  }
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
