import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cookieSessionLib from 'cookie-session';
import config from './core/config';

import userRouter from './routes/user';
import adminRouter from './routes/admin';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSessionLib({
  name: config.session.name,
  keys: [config.session.key],
  // Cookie Options
  // maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


app.use('/admin', adminRouter);
app.use('/', userRouter);

module.exports = app;
