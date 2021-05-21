import pg from 'pg';
import methodOverride from 'method-override';
import express from 'express';
import cookieParser from 'cookie-parser';

/* ============ CONFIGURATION =========== */

const { Pool } = pg;
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

// Cookies for password
app.use(cookieParser());

// Set the way we will connect to the server
const pgConnectionConfigs = {
  user: 'samanthalee',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port
};

// Create the var we'll use
const pool = new Pool(pgConnectionConfigs);

// Connect to the server
pool.connect();

/* ============ HOMEPAGE =========== */

app.get('/', (req, res) => {
  const loginMessage = 'not logged in';

  if (req.cookies.loggedIn === 'true') {
    pool.query('SELECT * FROM notes', (queryErr, queryRes) => {
      if (queryErr) {
        return console.error(queryErr);
      }
      // Array of objects from notes table
      const toggleLogin = req.query.user;
      // toggleLogin returns string 'login'
      console.log(toggleLogin);

      res.render('index', { array: queryRes.rows });
    // Print each owlObj into ejs file
    });
  } else {
    res.render('homepage');
  }

  console.log(loginMessage);
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

  pool.query(addOwlSqlQuery, (addOwlQueryErr, addOwlQueryRes) => {
    if (addOwlQueryErr) {
      console.log('error', addOwlQueryErr);
      return;
    }
    // rows key has the data
    res.redirect(303, `/note/confirm/${addOwlQueryRes.rows[0].id}`);
  });
});

app.get('/note/confirm/:id', (req, res) => {
  // req.params returns the id
  const { id } = req.params;
  res.render('confirmnote', { id });
});

/* ============ READ EXISTING NOTE =========== */

app.get('/note/:id', (req, res) => {
  const { id: owlTableId } = req.params;

  const getRowSqlQuery = `SELECT * FROM notes WHERE id=${owlTableId}`;

  pool.query(getRowSqlQuery, (getRowSqlErr, getRowSqlRes) => {
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

/* ============ SIGN UP / LOG IN / LOGOUT =========== */

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  // User's input
  const { name, email, password } = req.body;

  // Check if user exists
  const listUsersSqlQuery = `SELECT * FROM users WHERE email='${email}'`;

  pool.query(listUsersSqlQuery, (listUsersErr, listUsersRes) => {
    if (listUsersErr) {
      console.error(listUsersErr);
      return;
      // If the user exists
    } if (listUsersRes.rows.email === email) {
      res.send('you already have an account!');
      return;
    }
    // listUserRows = { id: '', email '', password: ''}
    const addUserSqlQuery = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}') RETURNING * `;

    pool.query(addUserSqlQuery, (addUserQueryErr, addUserQueryRes) => {
      if (addUserQueryErr) {
        console.error(addUserQueryErr);
        return;
      }
      res.redirect(303, '/login');
    });
  });
});

app.get('/login', (req, res) => {
  res.render('signin');
});

app.post('/login', (req, res) => {
  const { email: attemptEmail, password: attemptPassword } = req.body;
  // req.body returns { email: '', password: ''}

  pool.query(`SELECT * FROM users WHERE email='${attemptEmail}'`, (queryErr, queryRes) => {
    if (queryErr) {
      console.error(queryErr);
      return;
    }
    // queryRes.rows returns [ { id: 1, name: 'sam', email: 'sam@gmail.com', password: '1234' } ]
    // If the email exists, check if it has a matching password from the system
    const userData = queryRes.rows[0];
    const { password: realPassword } = userData;

    if (attemptPassword === realPassword) {
      console.log('yay correct pswd!');
      res.cookie('loggedIn', true);
      res.redirect(303, '/?user=login');
    } else {
      res.send('Whoops! Try again or contact your admin');
    }
  });
});

// LOG OUT
app.delete('/logout', (req, res) => {
  // delete cookies
  res.clearCookie('loggedIn');
  res.redirect(303, '/?user=logout');
});

/* ============ SPECIES =========== */

app.get('/species', (req, res) => {
  res.render('species-create');
});

app.post('/species', (req, res) => {
  // req.body returns object { "common_name": "", "scientific_name": "" }
  const { common_name: commonNameInput, scientific_name: scientificNameInput } = req.body;

  const addSpeciesQuery = `INSERT INTO species (name, scientific_name) VALUES ('${commonNameInput}', '${scientificNameInput}') RETURNING *`;

  pool.query(addSpeciesQuery, (addSpeciesErr, addSpeciesRes) => {
    if (addSpeciesErr) {
      console.error(addSpeciesErr);
      return;
    }
    // const { name: commonName, scientific_name: scientificName } = addSpeciesRes;
    res.redirect(303, '/species/all');
  });
});

/**
 * Shows all species page
 */
app.get('/species/all', (req, res) => {
  const listAllSpeciesQuery = 'SELECT * FROM species';
  pool.query(listAllSpeciesQuery, (listQueryErr, listQueryRes) => {
    if (listQueryErr) {
      console.error(listQueryErr);
      return;
    }
    const speciesObjArr = listQueryRes.rows;
    res.render('species-all', { array: speciesObjArr });
  });
});

/**
 * Shows the edit species page
 */
app.get('/species/:id/edit', (req, res) => {
  // req.params.id will return id ;
  const readSpeciesQuery = `SELECT * FROM species WHERE id='${req.params.id}'`;

  pool.query(readSpeciesQuery, (readQueryErr, readQueryRes) => {
    if (readQueryErr) {
      console.error(readQueryErr);
      return;
    }
    // readQueryRes.rows returns [ { id: 15, name: '', scientific_name: '' } ]
    res.render('species-edit', { data: readQueryRes.rows[0] });
  });
});

/**
 * When user updates Edit page with new data
 */
app.put('/species/:id/edit', (req, res) => {
  // req.body returns { "name": " ", "scientific_name": "" };
  const { id } = req.params;
  const { name, scientific_name } = req.body;
  const editSpeciesQuery = `UPDATE species SET name='${name}', scientific_name='${scientific_name}' WHERE id='${id}' RETURNING * `;

  pool.query(editSpeciesQuery, (editQueryErr, editQueryRes) => {
    // editQueryRes.rows[0] returns {"id": "", "name": "", "scientific_name":""};
    if (editQueryErr) {
      console.error(editQueryErr);
      return;
    }
    res.redirect(303, '/species/all');
  });
});

/**
 * User deletes species page
 */
app.delete('species/:id/edit', (req, res) => {
  const { id } = req.params;

  const deleteSpeciesQuery = `DELETE FROM species WHERE id='${id}'`;

  pool.query(deleteSpeciesQuery, (deleteQueryErr, deleteQueryRes) => {
    if (deleteQueryErr) {
      console.error(deleteQueryErr);
      return;
    }
    res.redirect(303, '/species/all');
  });
});

/* ============ LISTEN =========== */

app.listen(3004);
