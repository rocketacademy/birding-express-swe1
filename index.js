/* eslint-disable no-underscore-dangle */
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import pg from 'pg';
import {} from 'dotenv/config';

import indexRouter from './routes/index.js';

const app = express();
const __dirname = path.resolve('.');
// const __dirname = path.dirname('./app.js');
app.use('/', indexRouter);
// const pool = new Pool
// const { Pool } = pg;
// View engie setup

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT, () => console.log(`LISTENING ON http://localhost:${process.env.PORT}`));
