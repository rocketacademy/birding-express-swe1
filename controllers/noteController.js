import poolQueries from '../models/dbQuery.js';

// DISPLAYS ALL NOTES
export const allNotesController = (req, res) => {
  const query = 'select * from notes';

  poolQueries(query, (err, results) => {
    if (err) {
      console.log(`ERROR FROM allNotesController ${err}`);
      return;
    }
    const data = results;
    console.log(`THIS IS FROM allNotesController -->> ${data.rows}`);
    res.status(200).render('noteViews/allNotes',
      {
        title: 'All Notes',
        instructions: 'Display all notes here',
        data: data.rows,
      });
  });
};

// NEW NOTE FORM
export const createNoteController = (req, res) => {
  res.status(200).render('homeViews/createNote');
};

// FORM POST CONTROLLER
export const postNoteController = (req, res) => {
  let data;
  const {
    habitat, behaviour, flock_size, date,
  } = req.body;

  const values = [habitat, behaviour, flock_size, date];
  console.log(`arrayyyy ---> ${values}`);
  const query = 'INSERT INTO notes (habitat,behaviour,flock_size,date) VALUES ($1, $2, $3, $4) RETURNING *';

  poolQueries(query, values, (err, result) => {
    if (err) {
      console.log(`ERROR IN CONTROLLER postNoteController ${err}`);
    }
    data = result;

    // REDIRECT TO A SINGLE PAGE
    console.log(data.id);
    console.log(data);

    res.redirect('/note/all');
  });
};

// DISPLAYS SINGLE NOTE
export const singleNoteController = (req, res) => {
  const { id } = req.params;

  const sqlQuery = `SELECT * FROM notes WHERE id=${id}`;
  poolQueries(sqlQuery, (err, results) => {
    if (!err) {
      res.status(200).render('noteViews/singleNote',
        {
          title: 'Single Note',
          instructions: 'To render a single note here',
          data: results.rows[0],
        });
      return;
    }

    console.log(`ERROR FROM singleNoteController -->> ${err}`);
  });
};
