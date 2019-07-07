import express from 'express';
import {server, dbTblName} from '../../core/config';

const router = express.Router();

const signinProc = (req, res, next) => {
    res.render('user/auth/signin', {
        baseUrl: server.userBaseUrl,
        description: server.description,
        author: server.author,
        title: 'Sign In',
    });
};

const signupProc = (req, res, next) => {
    res.render('user/auth/signup', {
        baseUrl: server.userBaseUrl,
        description: server.description,
        author: server.author,
        title: 'Sign Up',
    });
};

const signoutProc = (req, res, next) => {
    req.session.user = undefined;
    if (req.xhr) {
        res.status(200).send({
            baseUrl: config.server.baseUrl,
            result: 'success',
            message: 'Successfully logouted',
        });
    } else {
        // res.redirect(config.server.baseUrl);
        res.redirect('/');
    }
};

router.get('/', signinProc);

router.get('/signin', signinProc);

router.get('/signup', signupProc);

router.get('/signout', signoutProc);
router.post('/signout', signoutProc);

module.exports = router;
