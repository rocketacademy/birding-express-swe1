import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

const { Pool } = pg;

const pool = new Pool({
  username: 'michellemok',
  host: 'localhost',
  database: 'birding',
  port: 5432,
});

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// display the bird sighting entry form
app.get('/note', (req, res) => {
  const speciesQuery = 'SELECT * FROM species';
  pool.query(speciesQuery, (speciesQueryError, speciesQueryResult) => {
    if (speciesQueryError) {
      console.log('error', speciesQueryError);
    } else {
      const data = {
        species: speciesQueryResult.rows,
      };
      console.log(data);
      res.render('note', data);
    }
  });
});

// enters the data recieved in '/note' into the database
app.post('/note', (req, res) => {
  const entryQuery = 'INSERT INTO notes (behaviour, flock_size, date, user_id, species_id) VALUES ($1, $2, $3, $4, $5)';

  const birdData = req.body;
  console.log(Number(req.cookies.userId));
  const inputData = [birdData.behaviour, Number(birdData.flock_size), birdData.date, Number(req.cookies.userId), Number(birdData.species_id)];

  pool.query(entryQuery, inputData, (entryError, entryResult) => {
    if (entryError) {
      console.log('error', entryError);
    } else {
      console.log(entryResult.rows);
      res.redirect('/');
    }
  });
});

// displays one single entry in the database
app.get('/note/:id', (req, res) => {
  const { id } = req.params;
  const singleNote = `SELECT notes.id, notes.behaviour, notes.flock_size, notes.user_id, notes.species_id, notes.date, users.email FROM notes INNER JOIN users ON notes.user_id = users.id WHERE notes.id = ${id}`;

  pool.query(singleNote, (singleNoteError, singleNoteResult) => {
    if (singleNoteError) {
      console.log('error', singleNoteError);
    } else {
      console.log(singleNoteResult.rows[0]);
      const oneNote = singleNoteResult.rows[0];
      console.log('one note', oneNote);
      res.render('single-note', { eachNote: oneNote });
    }
  });
});

// displays all the entries in the database
app.get('/', (req, res) => {
  console.log('logged in', req.cookies.loggedIn);
  if (!req.cookies.loggedIn) {
    res.status(403).send('please log in');
  } else {
    const allQuery = 'SELECT notes.id, notes.behaviour, notes.flock_size, notes.user_id, notes.species_id, notes.date, species.name FROM notes INNER JOIN species ON notes.species_id = species.id';
    pool.query(allQuery, (allQueryError, allQueryResult) => {
      if (allQueryError) {
        console.log('error', allQueryError);
      } else {
        console.log(allQueryResult.rows);
        const allNotes = allQueryResult.rows;
        res.render('landing-page', { allNotes });
      }
    });
  }
});

// displays edit form (with user auth)
app.get('/note/:id/edit', (req, res) => {
  const noteId = Number(req.params.id);
  const getNoteInfoQuery = `SELECT * FROM notes WHERE id = ${noteId}`;
  pool.query(getNoteInfoQuery, (getNoteInfoQueryError, getNoteInfoQueryResult) => {
    if (getNoteInfoQueryError) {
      console.log('error', getNoteInfoQueryError);
    } else {
      console.log(getNoteInfoQueryResult.rows);
      const noteInfo = getNoteInfoQueryResult.rows[0];
      // console.log('user_id', noteInfo.user_id);
      // console.log('userId from cookies', req.cookies.userId);
      // console.log('note id:', noteInfo.id);
      // console.log('date', noteInfo.date);
      if (noteInfo.user_id === Number(req.cookies.userId)) {
        const speciesQuery = 'SELECT * FROM species';
        pool.query(speciesQuery, (speciesQueryError, speciesQueryResult) => {
          if (speciesQueryError) {
            console.log('error', speciesQueryError);
          } else {
            const data = {
              species: speciesQueryResult.rows,
            };

            res.render('edit', { noteInfo, data });
          }
        });
      } else {
        res.send('You are not authorised to edit this post. ');
      }
    }
  });
});

// submit edit data
app.put('/note/:id/edit', (req, res) => {
  const id = Number(req.params.id);

  const editEntryQuery = `UPDATE notes SET behaviour = '${req.body.behaviour}', flock_size = ${Number(req.body.flock_size)}, date = '${req.body.date}', species_id = ${Number(req.body.species_id)} WHERE id = ${id} RETURNING *`;

  pool.query(editEntryQuery, (editEntryQueryError, editEntryQueryResult) => {
    if (editEntryQueryError) {
      console.log('error', editEntryQueryError);
    } else {
      console.log(editEntryQueryResult.rows);
      res.redirect('/');
    }
  });
});

// deletes a single note
app.delete('/note/:id/delete', (req, res) => {
  const noteId = Number(req.params.id);
  const getNoteInfoQuery = `SELECT * FROM notes WHERE id = ${noteId}`;
  pool.query(getNoteInfoQuery, (getNoteInfoQueryError, getNoteInfoQueryResult) => {
    if (getNoteInfoQueryError) {
      console.log('error', getNoteInfoQueryError);
    } else {
      console.log(getNoteInfoQueryResult.rows);
      const noteInfo = getNoteInfoQueryResult.rows[0];
      console.log('user_id', noteInfo.user_id);
      console.log('userId from cookies', req.cookies.userId);
      console.log('note id:', noteInfo.id);
      console.log('date', noteInfo.date);
      if (noteInfo.user_id === Number(req.cookies.userId)) {
        const deleteNoteQuery = `DELETE FROM notes WHERE id = ${noteId}`;
        pool.query(deleteNoteQuery, (deleteNoteError, deleteNoteResult) => {
          if (deleteNoteError) {
            console.log('error', deleteNoteError);
          } else {
            res.redirect('/');
          }
        });
      } else {
        res.send('You are not authorised to delete this post. ');
      }
    }
  });
});

// displays the sign up form
app.get('/signup', (req, res) => {
  res.render('sign-up');
});

// submits the data in the sign up form
app.post('/signup', (req, res) => {
  const newUserQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
  const inputData = [req.body.email, req.body.password];

  pool.query(newUserQuery, inputData, (newUserQueryError, newUserQueryResult) => {
    if (newUserQueryError) {
      console.log('error', newUserQueryError);
    } else {
      console.log(newUserQueryResult.rows);
      res.redirect('/');
    }
  });
});

// displays the login form
app.get('/login', (req, res) => {
  res.render('login');
});

// submits the login data
app.post('/login', (req, res) => {
  pool.query(`SELECT * FROM users WHERE email = '${req.body.email}'`, (emailQueryError, emailQueryResult) => {
    if (emailQueryError) {
      console.log('error', emailQueryError);
      res.status(503).send('request not successful');
      return;
    }

    if (emailQueryResult === 0) {
      res.status(403).send('not successful');
      return;
    }

    if (emailQueryResult.rows[0].password === req.body.password) {
      res.cookie('loggedIn', true);
      res.cookie('userId', emailQueryResult.rows[0].id);
      res.redirect('/');
    } else {
      res.status(403).send('not successful');
    }
  });
});

// logs the user out
app.delete('/logout', (req, res) => {
  res.clearCookie('loggedIn');
  res.clearCookie('userId');
  res.redirect('/login');
});

// TODO: not finished!!! need to render ejs !!!

app.get('/users/:id', (req, res) => {
  const usersId = Number(req.params.id);

  const getUserEntriesQuery = `SELECT notes.id, notes.behaviour, notes.flock_size, notes.date, species.name FROM notes INNER JOIN species ON notes.species_id = species.id INNER JOIN users ON notes.user_id = users.id WHERE users.id = ${usersId}`;

  pool.query(getUserEntriesQuery, (getUserEntriesQueryError, getUserEntriesQueryResult) => {
    if (getUserEntriesQueryError) {
      console.log('error', getUserEntriesQueryError);
    } else {
      console.log(getUserEntriesQueryResult.rows);

      res.render('user-page', {});
    }
  });
});
app.listen(PORT);

// TODO: comfortable onwards names in notes list etc
