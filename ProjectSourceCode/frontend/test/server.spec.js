// ********************** Initialize server **********************************

const server = require('../index'); // exported Express app (does not bind a port under test)

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** INTEGRATION TESTS **********************************
//
// These exercise the real Express routes end-to-end. They intentionally cover
// only paths that are deterministic without a live PostgreSQL instance —
// server-side input validation and authentication guards — so `npm test`
// passes on a fresh clone.

describe('BuffAI API', () => {

  // ---- Health check -------------------------------------------------------
  describe('GET /welcome', () => {
    it('returns the default welcome message', done => {
      chai
        .request(server)
        .get('/welcome')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.status).to.equal('success');
          assert.strictEqual(res.body.message, 'Welcome!');
          done();
        });
    });
  });

  describe('GET /', () => {
    it('serves the login page to anonymous visitors', done => {
      chai
        .request(server)
        .get('/')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          done();
        });
    });
  });

  // ---- Registration validation -------------------------------------------
  describe('POST /register', () => {
    it('negative: rejects an invalid email / short password with 400', done => {
      chai
        .request(server)
        .post('/register')
        .type('form')
        .send({
          student_id: '123456',
          fullName: 'Invalid User',
          email: 'not-an-email',   // fails validator.isEmail
          password: 'x',           // shorter than 6 characters
          year: 'senior',
          major: 'Computer Science',
          degree: 'BS'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('negative: rejects a non-numeric student id with 400', done => {
      chai
        .request(server)
        .post('/register')
        .type('form')
        .send({
          student_id: 'not-a-number',
          fullName: 'Invalid User',
          email: 'user@example.com',
          password: 'securepassword',
          year: 'senior',
          major: 'Computer Science',
          degree: 'BS'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });

  // ---- Login validation ---------------------------------------------------
  describe('POST /login', () => {
    it('negative: re-renders login when the student id is not numeric', done => {
      chai
        .request(server)
        .post('/login')
        .type('form')
        .send({ student_id: 'abc', password: 'whatever' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          done();
        });
    });
  });

  // ---- Authentication guards ---------------------------------------------
  describe('Authentication guards', () => {
    it('POST /stream is rejected for unauthenticated users (401)', done => {
      chai
        .request(server)
        .post('/stream')
        .send({ prompt: 'What courses do I still need?' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.error).to.equal('User not authenticated');
          done();
        });
    });

    it('POST /add-class redirects unauthenticated users back to /home', done => {
      chai
        .request(server)
        .post('/add-class')
        .type('form')
        .redirects(0)
        .send({ course_id: 'CSCI 1300', year: 'freshman' })
        .end((err, res) => {
          expect(res).to.have.status(302);
          expect(res.headers.location).to.match(/\/home/);
          done();
        });
    });

    it('GET /home renders the login page for anonymous users', done => {
      chai
        .request(server)
        .get('/home')
        .redirects(0)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.html;
          done();
        });
    });
  });
});
