import createError from 'http-errors';
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

app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('error/404', { baseUrl: config.server.baseUrl });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    // res.render('error');

    // respond with html page
    if (req.accepts('html')) {
        res.render('error/500', { baseUrl: config.server.baseUrl });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Internal server error' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Internal server error');
});

module.exports = app;
