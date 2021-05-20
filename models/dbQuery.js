import pool from './dbConfig.js';

const poolQueries = (query, values, callback) => {
  const handleQueryCallback = (err, results) => {
    if (err) {
      console.log(`ERROR IN handleQueryCallback ---> ${err}`);
      callback(err, null);
      return;
    }

    console.log(`SUCCESS IN handleQueryCallback ---> ${results}`);
    console.log(results.rows);
    callback(null, results.rows);
  };

  pool.query(query, values, handleQueryCallback);

  // if (values.length > 0) {
  //   pool.query(query, values, handleQueryCallback);
  // }
  // pool.query(query, handleQueryCallback);
};

export default poolQueries;
