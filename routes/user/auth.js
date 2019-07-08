import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import myCrypto from '../../core/myCrypto';
import strings from '../../core/strings';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const signInProc = (req, res, next) => {
    const method = req.method.toUpperCase();
    if (method == 'GET') {
        res.render('user/auth/signin', {
            baseUrl: server.userBaseUrl,
            uriRoot: server.userUriRoot,
            description: server.description,
            assetsVendorsRoot: server.assetsVendorsRoot,
            author: server.author,
            title: 'Sign In',
        });
    } else if (method == 'POST') {
        const params = req.body;
        const username = params.username.trim();
        // const email = params.email.trim();
        const password = params.password.trim();
        const rememberMe = !!(params.rememberMe) ? params.rememberMe.trim() : undefined;
        const hash = myCrypto.hmacHex(password);

        let sql = sprintf("SELECT COUNT(`email`) `count` FROM `users` WHERE BINARY `username` = '%s';", username);
        dbConn.query(sql, null, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.status(200).send({
                    result: strings.error,
                    message: strings.unknownServerError,
                    error: error,
                });
                return;
            }
            const count = parseInt(results[0].count);

            if (count === 0) {
                res.status(200).send({
                    result: strings.error,
                    message: strings.emailIsInvalid,
                });
                return;
            }
            sql = sprintf("SELECT U.* FROM `users` U WHERE BINARY U.username = '%s' AND BINARY U.password = '%s';", username, hash);

            dbConn.query(sql, null, (error, results, fields) => {
                if (error) {
                    console.log(error);
                    res.status(200).send({
                        result: strings.error,
                        message: strings.unknownServerError,
                        error: error,
                    });
                    return;
                }
                const count = typeof results !== "undefined" ? results.length : 0;

                if (count === 0) {
                    res.status(200).send({
                        result: strings.error,
                        message: strings.passwordIsInvalid,
                    });
                } else {
                    if (rememberMe == 'on') {
                        req.sessionOptions.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
                    } else {
                        req.sessionOptions.expires = false;
                    }
                    req.session.user = results[0];
                    res.status(200).send({
                        result: strings.success,
                        message: strings.successfullySignedIn,
                    });
                }
            });
        });
    }
};

const signUpProc = (req, res, next) => {
    const method = req.method.toUpperCase();
    if (method == 'GET') {
        res.render('user/auth/signup', {
            baseUrl: server.userBaseUrl,
            uriRoot: server.userUriRoot,
            description: server.description,
            assetsVendorsRoot: server.assetsVendorsRoot,
            author: server.author,
            title: 'Sign Up',
        });
    } else if (method == 'POST') {
        const params = req.body;
        const email = params.email.trim();
        const password = params.password.trim();
        const username = params.username.trim();
        const hash = myCrypto.hmacHex(password);

        let sql = sprintf("SELECT COUNT(`email`) `count` FROM `users` WHERE BINARY `email` = '%s';", email);
        dbConn.query(sql, null, (error, results, fields) => {
            if (error) {
                console.log(error);
                res.status(200).send({
                    result: strings.error,
                    message: strings.unknownServerError,
                    error: error,
                });
                return;
            }
            const count = parseInt(results[0].count);

            if (count > 0) {
                res.status(200).send({
                    result: strings.error,
                    message: strings.emailAlreadyRegistered,
                });
                return;
            }
            sql = sprintf("INSERT INTO `users`(`email`, `username`, `password`, `emailVerified`, `allow`) VALUES('%s', '%s', '%s', '0', '0');",
                email, username, hash);
            dbConn.query(sql, null, (error, results, fields) => {
                if (error) {
                    console.log(error);
                    res.status(200).send({
                        result: strings.error,
                        message: strings.unknownServerError,
                        error: error,
                    });
                } else {
                    res.status(200).send({
                        result: strings.success,
                        message: strings.successfullyRegistered,
                    });
                }
            });
        });
    }
};

const signOutProc = (req, res, next) => {
    req.session.user = undefined;
    if (req.xhr) {
        res.status(200).send({
            baseUrl: server.baseUrl,
            result: strings.success,
            message: strings.successfullySignedOut,
        });
    } else {
        // res.redirect(config.server.baseUrl);
        res.redirect('/');
    }
};

router.get('/', signInProc);

router.get('/signin', signInProc);
router.post('/signin', signInProc);

router.get('/signup', signUpProc);
router.post('/signup', signUpProc);

router.get('/signout', signOutProc);
router.post('/signout', signOutProc);

module.exports = router;
