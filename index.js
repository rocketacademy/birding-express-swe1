import express from 'express';
import pg from 'pg';

const { Pool } = pg;

const pgConnectionConfigs = {
  user: 'jyotikattani',
  host: 'localhost',
  database: 'birding',
  port: 5432,
};

const pool = new Pool(pgConnectionConfigs);

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

function createNewNote(req, res) {
  res.render('note');
}

function handleNotePostReq(req, res) {
  const formData = req.body;
  console.log(formData);
  console.log(typeof formData.date);
  console.log(`${formData.date},${formData.time},${formData.day},${formData.flock_size},${formData.habitat}`);
  const { date } = formData;
  const { time } = formData;
  const { day } = formData;
  const flockSize = formData.flock;
  console.log(`flock size ${flockSize}`);
  const { habitat } = formData;

  const notesInputData = `INSERT INTO notes (date, time, day, flock_size, habitat) VALUES ('${date}', '${time}', '${day}', ${flockSize} , '${habitat}' )`;

  pool.query(notesInputData, (err, result) => {
    if (err) {
      console.log(err);
      return err;
    }
    console.log(result);
    // res.send(result);
    res.redirect('/');
  });
}

function renderSingleNote(req, res) {
  const noteIndex = req.params.id;

  const singleNoteDate = `SELECT * FROM notes WHERE id = '${noteIndex}'`;
  pool.query(singleNoteDate, (err, result) => {
    if (err) {
      return err;
    }

    const singleNote = result.rows[0];
    console.log(singleNote);
    res.render('note-id', { singleNote });
  });
}

function renderListOfNotes(req, res) {
  const listOfNotes = 'SELECT * FROM notes';

  pool.query(listOfNotes, (err, result) => {
    if (err) {
      return err;
    }
    const allNotes = result.rows;
    console.log(allNotes);
    res.render('index', { allNotes });
  });
}
// get routes
// renders a form which creates a new note.
app.get('/note', createNewNote);
app.get('/note/:id', renderSingleNote);
app.get('/', renderListOfNotes);

// post route
app.post('/note', handleNotePostReq);

let PORT = '';
if (process.argv[2] === '80') {
  PORT = 80;
}
else {
  PORT = 3004;
}
app.listen(PORT, () => {
  console.log(`server started at: ${PORT}`);
});
