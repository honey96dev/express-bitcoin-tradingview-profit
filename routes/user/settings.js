import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import myCrypto from '../../core/myCrypto';
import strings from '../../core/strings';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const styles = [
        'plugins/x-editable/css/bootstrap-editable.css',
        'site/settings/index.css',
    ];
    const scripts = [
        'plugins/moment/moment.js',
        'plugins/x-editable/js/bootstrap-editable.min.js',
        'plugins/parsleyjs/parsley.min.js',
        server.assetsVendorsRoot + "jquery-form/jquery.form.min.js",
        'site/settings/index.js',
    ];
    console.log(req.session.user);
    res.render('user/settings/index', {
        baseUrl: server.userBaseUrl,
        uriRoot: server.userUriRoot,
        description: server.description,
        assetsVendorsRoot: server.assetsVendorsRoot,
        author: server.author,
        title: 'Settings',
        styles,
        scripts,
        data: req.session.user,
    });
};

const savePropertiesProc = (req, res, next) => {
    const params = req.body;
    const id = req.session.user.id;
    const email = params.email;
    const bitmexApikey = params.bitmexApikey;
    const bitmexApikeySecret = params.bitmexApikeySecret;
    let bitmexTestnet = params.bitmexTestnet;

    let sql = sprintf("UPDATE `%s` SET `email` = '%s', `bitmexApikey` = '%s', `bitmexApikeySecret` = '%s', `bitmexTestnet` = '%d' WHERE `id` = '%d';", dbTblName.users, email, bitmexApikey, bitmexApikeySecret, bitmexTestnet, id);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
                error: error,
            });
            return;
        }

        req.session.user.email = email;
        req.session.user.bitmexApikey = bitmexApikey;
        req.session.user.bitmexApikeySecret = bitmexApikeySecret;
        req.session.user.bitmexTestnet = bitmexTestnet;
        res.status(200).send({
            result: strings.success,
            message: strings.successfullySaved,
        });
    });
};

const changePasswordProc = (req, res, next) => {
    const params = req.body;
    const id = req.session.user.id;
    const oldPassword = params.oldPassword;
    const password = params.password;
    const oldHash = myCrypto.hmacHex(oldPassword);
    const hash = myCrypto.hmacHex(password);

    let sql = sprintf("SELECT U.id FROM `%s` U WHERE U.id = '%d' AND U.password = '%s';", dbTblName.users, id, oldHash);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error || !result) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
                error: error,
            });
            return;
        }
        if (result.length === 0) {
            res.status(200).send({
                result: strings.error,
                message: strings.currentPasswordIncorrect,
                error: error,
            });
            return;
        }
        sql = sprintf("UPDATE `%s` SET `password` = '%s' WHERE `id` = '%d';", dbTblName.users, hash, id);
        dbConn.query(sql, null, (error, result, fields) => {
            if (error) {
                console.log(error);
                res.status(200).send({
                    result: strings.error,
                    message: strings.unknownServerError,
                    error: error,
                });
                return;
            }
            res.status(200).send({
                result: strings.success,
                message: strings.successfullyChanged,
            });
        });
    });
};

router.get('/', indexProc);
router.post('/properties', savePropertiesProc);
router.post('/password', changePasswordProc);

module.exports = router;
