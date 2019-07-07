import express from 'express';
import config from '../core/config';
import authRouter from './user/auth';

const router = express.Router();

function requiresLogin(req, res, next) {
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    } else {
        res.redirect(config.server.userBaseUrl + 'auth');
    }
}
function alreadyLogin(req, res, next) {
    // console.log('alreadyLogin', req.url);
    if (req.url === '/signout') {
        return next();
    }
    if (req.session && req.session.user && req.session.user.id) {
        res.redirect(config.server.userBaseUrl);
    } else {
        return next();
    }
}

router.use('/auth', alreadyLogin, authRouter);
router.use('/', requiresLogin, authRouter);

module.exports = router;
