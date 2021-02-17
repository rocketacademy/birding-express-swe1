import express from 'express';
import pg from 'pg';
import methodOverride from 'method-override';

const Pool = pg.Pool;

const pool = new Pool ({
  username: 'michellemok',
  host: 'localhost',
  database: 'birding',
  port: 5432,
})

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));


// display the bird sighting entry form
app.get('/note', (req, res) => {
  res.render('note');
})

app.post('/note', (req, res) => {
  const entryQuery = 'INSERT INTO notes (behaviour, flock_size, date) VALUES ($1, $2, $3)';

  const birdData = req.body;
  
  const inputData = [birdData.behaviour, Number(birdData.flock_size), birdData.date];
  
  pool.query(entryQuery, inputData, (entryError, entryResult) => {
    if (entryError) {
      console.log('error', entryError);
    } else {
      console.log(entryResult.rows);
      res.send(entryResult.rows);
    }
  })
})

app.get('/note/:id', (req, res) => {
  const id = Number(req.params.id);
  const singleNote = `SELECT * FROM notes WHERE id = ${id}`;

  pool.query(singleNote, (singleNoteError, singleNoteResult) => {
    if (singleNoteError) {
      console.log('error', singleNoteError);
    } else {
      console.log(singleNoteResult.rows);
      const oneNote = singleNoteResult.rows[0];
      res.render('single-note', { oneNote: oneNote});
    }
  })
}) 

app.get('/', (req, res) => {
  const allQuery = 'SELECT * FROM notes';
  pool.query(allQuery, (allQueryError, allQueryResult) => {
    if (allQueryError) {
      console.log ('error', allQueryError);
    } else {
      console.log(allQueryResult.rows);
      const allNotes = allQueryResult.rows;
      res.render('landing-page', { allNotes: allNotes } );
    }
  })
})

// TODO: complete PUT DELETE requests

app.get('/note/:id/edit', (res, req) => {
  res.render('edit');
})

app.listen(PORT);

app.get('/signup', (req,res) => {
  res.render('sign-up');
})