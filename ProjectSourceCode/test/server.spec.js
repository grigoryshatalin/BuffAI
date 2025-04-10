// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

describe('Testing Add Student API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        year: 'Sophomore',
        major: 'Computer Science',
        degree: 'BS'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        // adjust this based on what your /register route actually returns
        expect(res).to.redirect;
        done();
      });
  });
});

describe('Testing Register Student API', () => {
  it('negative : /register - invalid email and password', done => {
    chai
      .request(server)
      .post('/register')
      .send({
        first_name: 'Invalid',
        last_name: 'User',
        email: 'not-an-email',         // Invalid email format
        password: '',                  // Empty password (invalid)
        year: 'Senior',
        major: 'Computer Science',
        degree: 'BS'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equal('Invalid input');
        done();
      });
  });
});



// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************