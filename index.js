import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';

/* ============ CONFIGURATION =========== */

const { Client } = pg;
const app = express();

// Set the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Set up static directory
app.use(express.static('public'));

// Built-in express parser to parse req.body as JSON
// npm i --save body-parser
// app.use(express.json({ extended: false }));
// app.use(express.json())

// Receive POST Requests in Express
app.use(express.urlencoded({ extended: true }));

// Override POST requests with query param ?_method=PUT to be PUT requeåsts
app.use(methodOverride('_method'));

// Set the way we will connect to the server
const pgConnectionConfigs = {
  user: 'samanthalee',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port
};

// Create the var we'll use
const client = new Client(pgConnectionConfigs);

// Connect to the server
client.connect();

// Query done callback
const whenQueryDone = (error, result) => {
  // this error is anything that goes wrong with the query
  if (error) {
    console.log('error', error);
  } else {
    // rows key has the data
    console.log(result.rows);
  }

  // close the connection
  client.end();
};

/* ============ HOMEPAGE =========== */

app.get('/', (req, res) => {
  const sqlQuery = 'SELECT * FROM notes';

  client.query(sqlQuery, (queryErr, queryRes) => {
    if (queryErr) {
      return console.error(queryErr);
    }
    // Array of objects from notes table
    res.render('index', { array: queryRes.rows });
    // Print each owlObj into ejs file
  });
});

/* ============ CREATE / READ FORM =========== */

app.get('/note', (req, res) => {
  res.render('createnote', {});
});

app.post('/note', (req, res) => {
  // req.body returns JS object { "type_of_owl": "", "photo": "", "date": "2021-05-04" ...}
  console.log(req.body);
  const {
    id,
    type_of_owl: owlType,
    photo,
    date,
    spotter,
    cuteness_factor: cuteness,
    location,
  } = req.body;

  // Adds a new row into notes table
  const addOwlSqlQuery = `INSERT INTO notes (type_of_owl, photo, date, spotter, cuteness_factor, location) VALUES ( '${owlType}', '${photo}','${date}','${spotter}',${cuteness},'${location}') RETURNING *`;

  client.query(addOwlSqlQuery, (addOwlQueryErr, addOwlQueryRes) => {
    if (addOwlQueryErr) {
      console.log('error', addOwlQueryErr);
      return;
    }
    // rows key has the data
    res.redirect(303, `/note/confirm/${addOwlQueryRes.rows[0].id}`);
    // console.log(addOwlQueryRes.rows);
    // close the connection
    // client.end();
  });
});

app.get('/note/confirm/:id', (req, res) => {
  // req.params returns the id
  const { id } = req.params;
  res.render('confirmnote', { id });
});

app.get('/note/:id', (req, res) => {
  const { id: owlTableId } = req.params;

  const getRowSqlQuery = `SELECT * FROM notes WHERE id=${owlTableId}`;

  client.query(getRowSqlQuery, (getRowSqlErr, getRowSqlRes) => {
    if (getRowSqlErr) {
      console.log('error: ', getRowSqlErr);
      return;
    }

    const {
      id,
      type_of_owl: owlType,
      photo,
      date,
      spotter,
      cuteness_factor: cuteness,
      location,
    } = getRowSqlRes.rows[0];

    res.render('singlenote', {
      id, owlType, photo, date, spotter, cuteness, location,
    });
  });
});

/* ============ UPDATE / DELETE FORM =========== */

// app.put();

// app.delete();

/* ============ READ EXISTING NOTE =========== */

// app.get('/note/:id', (req, res) => {
//   res.render('singlenote', {});
// });

/* ============ SIGN UP / LOG IN / LOGOUT =========== */

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const listUsersSqlQuery = `SELECT * FROM users WHERE email=${email}`;

  client.query(listUsersSqlQuery, (listUsersErr, listUsersRes) => {
    if (listUserErr) {
      console.error(listUsersErr);
      return;
    } if (listUsersRes) {
      // if the user exists
    }
    const usersObjArr = listUsersRes.rows;
    console.log(usersObjArr);
    res.redirect(303, '/login');
    client.end();
  });

  // const addUserSqlQuery = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}') RETURNING * `;

  // client.query(addUserSqlQuery, (addUserQueryErr, addUserQueryRes) => {
  //   if (addUserQueryErr) {
  //     console.error(addUserQueryErr);
  //     return;
  //   }
  //   console.log(addUserQueryRes.rows[0]);

  // })
});

app.get('/login', (req, res) => {
  res.render('signin');
});

app.post('/login', (req, res) => {
  // const { }
  // Send cookie in the response header
  // Log user in
  // Redirect user to the dashboard?
  console.log(req.body);
});

/* ============ LISTEN =========== */

app.listen(3004);
