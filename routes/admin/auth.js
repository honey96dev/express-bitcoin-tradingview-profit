import express from 'express';
import config from '../../core/config';

const router = express.Router();

const signinProc = (req, res, next) => {
    res.send('respond with a resource amin');
};

const signupProc = (req, res, next) => {
    res.send('respond with a resource');
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
