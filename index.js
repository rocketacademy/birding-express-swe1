/* ================================================================== IMPORT MODULES = */
// express / server stuff
import express from 'express';
import methodOverride from 'method-override'; // npm install method-override
import moment from 'moment'; // npm install moment
// import cookieParser from 'cookie-parser';

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
// app.use(cookieParser());

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
/* ========================================================================= */
/* ================================================================== ROUTES */
/* ========================================================================= */
// HOMEPAGE
app.get('/', (req, res) => {
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
    res.render('index', { dataArr, dateOfSightingArr });
  });
});

// SORTING FOR HOMEPAGE
app.get('/:sort', (req, res, next) => {
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
      res.render('index', { dataArr, dateOfSightingArr });
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

// SINGLE PAGES
app.get('/note/:id', (req, res) => {
  // get id
  const { id } = req.params;
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
    // render
    res.render('single-sighting', dataForSelectedId);
  });
});

// POST SIGHTING
// get
app.get('/note', (req, res) => {
  const formMaxDate = { maxDate: getCustomDateAndTime('form') };
  res.render('note', formMaxDate);
});
// post
app.post('/note', (req, res) => {
// get sighting submission
  const dataObj = req.body;
  // Add new  data in sql database
  const inputData = [dataObj.date_of_sighting, dataObj.appearance, dataObj.behaviour, dataObj.flock_size];
  const sqlQuery = 'INSERT INTO notes (date_of_sighting, appearance, behaviour, flock_size) VALUES ($1, $2, $3, $4) RETURNING *';
  pool.query(sqlQuery, inputData, (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    // acknowledge save
    console.log(result.rows);
    // Redirect
    res.redirect('/form-submit-successful');
  });
});

// FORM SUBMISSION SUCCESS
app.get('/form-submit-successful', (req, res) => {
  res.render('form-submit-successful');
});

// EDIT SIGHTING
// get
app.get('/note/:id/edit', (req, res) => {
  // get id
  const { id } = req.params;
  // set max date for form
  const formMaxDate = { maxDate: getCustomDateAndTime('form') };
  // get data for form
  const sqlQuery = `SELECT * FROM notes WHERE id= ${id}`;
  pool.query(sqlQuery, (error, result) => {
    if (error) {
      console.log('Error executing query for edit form', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    const dataForSelectedId = result.rows[0];
    // the date is in ISO 8601 format. we need to use moment to convert
    // it to a readable format for the form
    const refomatDateOfSighting = convertDate(dataForSelectedId.date_of_sighting, 'ISO8601', 'YYYY-MM-DD');
    dataForSelectedId.date_of_sighting = refomatDateOfSighting;
    // render
    res.render('edit', { dataForSelectedId, formMaxDate });
  });
});

// post
app.put('/note/:id/edit', (req, res) => {
  // get id
  const { id } = req.params;
  // get updated data
  const editedForm = req.body;
  console.log(editedForm);
  // update DB
  const sqlQuery = `UPDATE notes SET date_of_sighting = '${editedForm.date_of_sighting}', appearance = '${editedForm.appearance}', behaviour = '${editedForm.behaviour}', flock_size = '${editedForm.flock_size}' WHERE id = ${id}`;
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

// DELETE A SIGHTING
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

// Test if branch is working
