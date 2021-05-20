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
  // req.body returns JSON object { "type_of_owl": "", "photo": "", "date": "2021-05-04" ...}
  const {
    type_of_owl, photo, date, spotter, cuteness_factor, location,
  } = req.body;

  const addOwlSqlQuery = `INSERT INTO notes (type_of_owl, photo, date, spotter, cuteness_factor, location) VALUES ( '${type_of_owl}', '${photo}','${date}','${spotter}','${cuteness_factor}','${location}') RETURNING *`;

  client.query(addOwlSqlQuery, (err, res) => {
    // this error is anything that goes wrong with the query
    if (err) {
      console.log('error', err);
    } else {
      // rows key has the data
      res.redirect(303, 'confirmnote');
      console.log(res.rows);
    }
    // close the connection
    client.end();
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
  res.render('signup', {});
});

app.post('signup', (req, res) => {
  res.redirect(303, 'signup-confirm');
});

app.get('/login', (req, res) => {
  res.render('signin', {});
});

app.post('/login', (req, res) => {
  // Send cookie in the response header
  // Log user in
  // Redirect user to the dashboard?
});

/* ============ LISTEN =========== */

app.listen(3004);
