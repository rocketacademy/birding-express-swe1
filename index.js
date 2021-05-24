/* ================================================================== IMPORT MODULES = */
// express / server stuff
import express from 'express';
import methodOverride from 'method-override'; // npm install method-override
import moment from 'moment'; // npm install moment
import cookieParser from 'cookie-parser'; // npm install cookie-parser

// hashing
import jsSHA from 'jssha';

// postgres / database stuff
import pg from 'pg'; // npm install pg

/* ================================================================== DATABASE SET UP */
// Initialise the DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'eddiejpot',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

/* ================================================================== EXPRESS AND EJS SET UP */
// Initialise Express
const app = express();
const PORT = 3004;

// Override POST requests with query param ?_method=PUT to be PUT requests
app.use(methodOverride('_method'));

/* The code below allows us to listen for post requests
  *read more about it below
  *https://bootcamp.rocketacademy.co/3-backend-applications/3.1-express-js/3.1.3-handling-post-requests#receive-post-requests-in-express
*/
app.use(express.urlencoded({ extended: false }));

// EJS Set Up
app.set('view engine', 'ejs');
// allow access to public directory
app.use(express.static('public'));

/* ================================================================== COOKIES SET UP */
app.use(cookieParser());

/* ================================================================== FUNCTIONS */
/**
 * Outputs an array with table data
 * @param {Array} arrOfNameOfColumns takes in an array of the column names e.g. ['date_of_sighting', 'behaviour']
 * @returns {Array} returns an object with the column names as the key
 */
const getColumnData = (arrOfNameOfColumns) => {
  const returnObj = {};
  return (req, res, next) => {
  // Query using pg.Pool instead of pg.Client
    arrOfNameOfColumns.forEach((e, i) => {
      pool.query(`SELECT ${e} from notes`, (error, result) => {
        if (error) {
          console.log('Error executing query', error.stack);
          res.status(503).send(result.rows);
          return;
        }
        // add to object
        returnObj[e] = result.rows;
        // exit when ending loop
        // needed to do this inside the pool.query function
        if (arrOfNameOfColumns.length === i + 1) {
          req.requestedDateFromColumn = returnObj;
          next();
        }
      });
    });
  };
};

/**
 * Outputs a custom date and time format
 * @param {String} dateFormat
 * @returns {String}
 * param: 'DD/MM/YYYY' returns 14/12/2020
 * param: 'custom' returns 'a month ago...' etc
 * param: 'form' returns 2021-05-13
 */
const getCustomDateAndTime = (dateFormat) => {
  if (dateFormat === 'DD/MM/YYYY') {
    const date = moment().format('DD/MM/YYYY');
    const time = moment().format('HH:mm');
    return (`${date} ${time}`);
  }
  if (dateFormat === 'custom') {
    const arr = ['YYYY', 'M', 'DD', 'HH', 'mm', 's'];
    const getMoment = arr.map((e) => {
      if (e === 'M') {
        console.log(e);
        const month = Number(moment().format(e)) - 1;
        return month.toString();
      }
      return moment().format(e);
    });
    const customTime = moment(getMoment).fromNow();
    return customTime;
  }
  if (dateFormat === 'form') {
    const date = moment().format('YYYY-MM-DD');
    return date;
  }
};

/**
 * Converts a date into another format
 * @param {Object} date
 * @param {String} formatFrom type to format from e.g. 'ISO8601'
 * @param {String} formatTo type to format to e.g. 'DD/MM/YYYY'
 */
const convertDate = (date, formatFrom, formatTo) => {
  let outputFormatedDate;
  if (formatFrom === 'ISO8601') {
    outputFormatedDate = moment(moment(date).toISOString()).format(formatTo);
    return outputFormatedDate;
  }
};

/* ================================================================== MIDDLEWARE FUNCTIONS */

/**
 * Check if user is logged in
 * @returns {Booleanr} isUserLoggedIn (req.isUserLoggedIn)
 */
const checkIfLoggedIn = (req, res, next) => {
  const loginCookie = Object.keys(req.cookies);
  req.isUserLoggedIn = false;
  if (loginCookie.includes('loggedIn')) {
    req.isUserLoggedIn = true;
  }
  next();
};

/**
 * Get cookie data
 * @returns username (req.userName) & userId (req.userId)
 */
const getUserNameAndIdCookie = (req, res, next) => {
  req.userName = req.cookies.userName;
  req.userId = req.cookies.userId;
  next();
};
/*
 * PRECIOUS CALLBACK FUNCTION
*/
const selectDataSqlQuery = (sqlQuery, callback) => {
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      // handle errors own way
      callback(error, null);
      return;
    }
    const data = result.rows;
    callback(null, data);
  });
};

/* =========================================================================================== */
/* ==================================================================================== ROUTES */
/* =========================================================================================== */

/* ================================================================ SIGN UP */
// SIGN UP
app.get('/sign-up', (req, res) => {
  // render
  res.render('sign-up');
});
app.post('/sign-up', (req, res) => {
// get user sign up details
  const userSignUpUserName = req.body.username;
  const userSignUpEmail = req.body.email;
  const userSignUpPassword = req.body.password;

  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input the password from the request to the SHA object
  shaObj.update(userSignUpPassword);
  // get the hashed password as output from the SHA object
  const hashedPassword = shaObj.getHash('HEX');

  // Store email and hased password in db
  const inputData = [userSignUpEmail, hashedPassword, userSignUpUserName];
  const sqlQuery = 'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING *';
  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing sign in query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    // acknowledge save
    console.log(result.rows);
    // Redirect to login page
    res.redirect('/login');
  });
});

/* ============================================================== USER LOGIN / LOG OUT */
// LOGIN
app.get('/login', (req, res) => {
  // render
  res.render('login');
});

app.post('/login', (req, res) => {
  console.log('request for login in');

  // Check if email exists
  const email = [req.body.email];
  pool.query('SELECT * from users WHERE email=$1', email, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }

    // If email does not exist
    if (result.rows.length === 0) {
      // the error for password and user are the same. don't tell the user which error they got for
      // security reasons, otherwise people can guess if a person is a user of a given service.
      res.status(403).send('sorry!');
      return;
    }

    // If email exists...
    const user = result.rows[0];

    // initialise SHA object
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    // input the password from the request to the SHA object
    shaObj.update(req.body.password);
    // get the hashed value as output from the SHA object
    const hashedPassword = shaObj.getHash('HEX');

    if (user.password !== hashedPassword) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      res.status(403).send('login failed!');
      return;
    }

    // if email exists and password is correct
    console.log('LOGGED IN');
    // send cookies
    // logged in cookie
    res.cookie('loggedIn', true);
    // user id cookie
    res.cookie('userId', user.id);
    // userName cookie
    res.cookie('userName', user.username);
    // redirect to homepage
    res.redirect('/');
  });
});

// LOG OUT
app.delete('/logout', (req, res) => {
  // delete cookies
  res.clearCookie('loggedIn');
  res.clearCookie('userId');
  res.clearCookie('userName');
  console.log('LOGGED OUT!');
  // redirect to login page
  res.redirect('/login');
});

/* ================================================================= CHECK FOR COOKIES */
app.all('*', checkIfLoggedIn, (req, res, next) => {
  console.log('In check route');

  // if there is a userName cookie it means there is a login cookie
  if (req.isUserLoggedIn) {
    return next();
  }

  // if don't have login cookie
  console.log('Unverified user! Proceed to login page');
  // redirect to login
  res.redirect('/login');
});

/* ================================================================== OTHER PAGES */
// ------------------------------ HOMEPAGE
app.get('/', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  const { userName } = req;
  const { userId } = req;
  // get data
  const sqlQuery = 'SELECT id, date_of_sighting, flock_size FROM notes';
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing homepage query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    const dataArr = { arr: result.rows };
    // the date is in ISO 8601 format. we need to use moment to convert
    // it to a readable format for the form
    let dateOfSightingArr = [];
    dataArr.arr.forEach((e, i) => {
      const refomatDateOfSighting = convertDate(e.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
      dateOfSightingArr.push(refomatDateOfSighting);
    });
    dateOfSightingArr = { sightingArr: dateOfSightingArr };
    // render
    res.render('index', {
      dataArr, dateOfSightingArr, userName, userId,
    });
  });
});

// ------------------------------- HOMEPAGE WITH SORTING
app.get('/:sort', getUserNameAndIdCookie, (req, res, next) => {
  // get cookie data
  const { userName } = req;
  const { userId } = req;
  // sort database function
  const sortDataBase = (typeOfSortSql) => {
    const sqlQuery = `SELECT * FROM notes ORDER BY date_of_sighting ${typeOfSortSql}`;
    pool.query(sqlQuery, (error, result) => {
      if (error) {
        console.log('Error executing homepage query', error.stack);
        res.status(503).send(result.rows);
        return;
      }
      const dataArr = { arr: result.rows };
      // the date is in ISO 8601 format. we need to use moment to convert
      // it to a readable format for the form
      let dateOfSightingArr = [];
      dataArr.arr.forEach((e, i) => {
        const refomatDateOfSighting = convertDate(e.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
        dateOfSightingArr.push(refomatDateOfSighting);
      });
      dateOfSightingArr = { sightingArr: dateOfSightingArr };
      // render
      res.render('index', {
        dataArr, dateOfSightingArr, userName, userId,
      });
    });
  };

  // get query param
  const { sort } = req.params;
  switch (sort) {
    case 'sort=asc':
    // sort data base
      sortDataBase('ASC');
      break;
    case 'sort=desc':
    // code block
      sortDataBase('DESC');
      break;
    default:
      next();
  }
});

// ------------------------------- USER SIGHTINGS
app.get('/users/:id', getUserNameAndIdCookie, (req, res) => {
  // get url query
  const { id } = req.params;
  // get cookie data
  const { userName } = req;
  const { userId } = req;
  // get data
  const sqlQuery = `SELECT id, date_of_sighting, flock_size FROM notes WHERE user_id = ${id}`;
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing homepage query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    const dataArr = { arr: result.rows };
    // the date is in ISO 8601 format. we need to use moment to convert
    // it to a readable format for the form
    let dateOfSightingArr = [];
    dataArr.arr.forEach((e, i) => {
      const refomatDateOfSighting = convertDate(e.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
      dateOfSightingArr.push(refomatDateOfSighting);
    });
    dateOfSightingArr = { sightingArr: dateOfSightingArr };
    // render
    res.render('users', {
      dataArr, dateOfSightingArr, userName, userId,
    });
  });
});

// -------------------------------- SINGLE PAGES
app.get('/note/:id', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  // const { userName } = req;
  const { userId } = req;

  // get id
  const { id } = req.params;

  // query selected note id
  const sqlQuery = `SELECT * FROM notes WHERE id=${id}`;
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }

    const dataForSelectedId = result.rows[0];
    // the date is in ISO 8601 format. we need to use moment to convert
    // it to a readable format for the form
    const refomatDateOfSighting = convertDate(dataForSelectedId.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
    dataForSelectedId.date_of_sighting = refomatDateOfSighting;

    // query selected bird
    const birdSqlQuery = `SELECT species.name FROM notes INNER JOIN species ON notes.species_id = species.id WHERE notes.id=${id}`;
    pool.query(birdSqlQuery, (birdError, birdResult) => {
      if (birdError) {
        console.log('Error executing query', birdError.stack);
        res.status(503).send(birdResult.rows);
        return;
      }
      const selectedBird = { birdName: birdResult.rows[0].name };
      // render
      res.render('single-sighting', { dataForSelectedId, userId, selectedBird });
    });
  });
});

// -------------------------------- POST SIGHTING
// get
app.get('/note', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  // const { userName } = req;
  const { userId } = req;

  // set max date for calendar input
  const formMaxDate = { maxDate: getCustomDateAndTime('form') };

  // query for list of birds
  const sqlQuery = 'SELECT * FROM species';
  pool.query(sqlQuery, (err, data) => {
    if (err) {
      console.error('Error executing species query', err.stack);
      res.status(503).send(data);
      return;
    }
    const birdSpecies = { birds: data.rows };

    // render
    res.render('note', { formMaxDate, userId, birdSpecies });
  });
});

// post
app.post('/note', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  // const { userName } = req;
  const { userId } = req;

  // get sighting submission
  const dataObj = req.body;
  // Add new  data in sql database
  const inputData = [dataObj.date_of_sighting, dataObj.appearance, dataObj.behaviour, dataObj.flock_size, userId, dataObj.species_id];
  const sqlQuery = 'INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size, user_id, species_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.error('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    // acknowledge save
    console.log(result.rows);
    // Redirect
    res.redirect('/form-submit-successful');
  });
});

// -------------------------------- FORM SUBMISSION SUCCESS
app.get('/form-submit-successful', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  // const { userName } = req;
  const { userId } = req;
  // render
  res.render('form-submit-successful', { userId });
});

// -------------------------------- EDIT SIGHTING
// get
app.get('/note/:id/edit', getUserNameAndIdCookie, (req, res) => {
  // get cookie data
  // const { userName } = req;
  const { userId } = req;

  // get id
  const { id } = req.params;
  // set max date for form
  const formMaxDate = { maxDate: getCustomDateAndTime('form') };
  // get data for form

  // query for notes
  const noteSqlQuery = `SELECT * FROM notes WHERE id= ${id}`;
  pool.query(noteSqlQuery, (noteErr, noteData) => {
    if (noteErr) {
      console.error('Error executing edit form query', noteErr.stack);
      res.status(503).send(noteData);
      return;
    }

    const dataForSelectedId = noteData.rows[0];

    // the date is in ISO 8601 format. we need to use moment to convert
    // it to a readable format for the form
    const refomatDateOfSighting = convertDate(dataForSelectedId.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
    dataForSelectedId.date_of_sighting = refomatDateOfSighting;

    // query for selected bird from previous form
    const previousBirdSqlQuery = `SELECT species.name, species.id FROM notes INNER JOIN species ON notes.species_id = species.id WHERE notes.id = ${id}`;
    pool.query(previousBirdSqlQuery, (singleBirdErr, singleBirdData) => {
      if (singleBirdErr) {
        console.error('Error executing single bird query', singleBirdErr.stack);
        res.status(503).send(singleBirdData.rows);
        return;
      }

      const previousSelectedBird = { selectedBird: singleBirdData.rows[0] };

      // query for list of birds
      const birdsSqlQuery = 'SELECT * FROM species';
      pool.query(birdsSqlQuery, (birdsErr, birdsData) => {
        if (birdsErr) {
          console.error('Error executing bird query', birdsErr.stack);
          res.status(503).send(birdsData.rows);
          return;
        }
        const birdSpecies = { birds: birdsData.rows };

        // render
        res.render('edit', {
          dataForSelectedId, formMaxDate, userId, birdSpecies, previousSelectedBird,
        });
      });
    });
  });
});

// post
app.put('/note/:id/edit', (req, res) => {
  // get id
  const { id } = req.params;
  // get updated data
  const editedForm = req.body;
  console.log('EDITED FORM !!!!!!!!!!!!!!!!!!');
  console.log(editedForm);
  // update DB
  const sqlQuery = `UPDATE notes SET
  date_of_sighting = '${editedForm.date_of_sighting}',
  appearance = '${editedForm.appearance}',
  behaviour = '${editedForm.behaviour}',
  flock_size = '${editedForm.flock_size}',
  species_id = ${editedForm.species_id}
  WHERE id = ${id}
  RETURNING *`;
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing edit for form', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    console.log(`Success in edit! :${result.rows}`);
    // re-direct
    res.redirect(`/note/${id}`);
  });
});

// -------------------------------- DELETE A SIGHTING
app.delete('/note/:id', (req, res) => {
  const { id } = req.params;
  const sqlQuery = `DELETE FROM notes WHERE id=${id}`;
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing delete', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    console.log(`Success in delete!: ${result.rows}`);
    // re-direct to homepage
    res.redirect('/');
  });
});

/* ================================================================== LISTEN */
app.listen(PORT);
