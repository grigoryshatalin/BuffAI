const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'postgress',
  host: 'localhost',
  database: 'users_db',
  password: 'pwd',
  port: 5432,
});

app.post('/register', async (req, res) => {
  const {student_id, fullname, email, year, major, degree, minor, password} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO students (student_id, fullname, email, year, major, degree, minor, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [student_id, fullname, email, year, major, degree, minor, hashedPassword];

    await pool.query(query, values);

    res.send('Registration successful!');
    console.log(req.body);
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong!');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
