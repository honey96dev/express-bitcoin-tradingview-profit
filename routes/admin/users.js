import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import strings from '../../core/strings';
import myCrypto from '../../core/myCrypto';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const styles = [
        'plugins/datatables/dataTables.bootstrap4.min.css',
        'plugins/datatables/buttons.bootstrap4.min.css',
        'plugins/datatables/responsive.bootstrap4.min.css',
        'site/users/index.css',
    ];
    const scripts = [
        'plugins/datatables/jquery.dataTables.min.js',
        'plugins/datatables/dataTables.bootstrap4.min.js',
        'plugins/datatables/dataTables.buttons.min.js',
        'plugins/datatables/buttons.bootstrap4.min.js',
        'plugins/datatables/dataTables.responsive.min.js',
        'plugins/datatables/responsive.bootstrap4.min.js',
        server.assetsVendorsRoot + "jquery-form/jquery.form.min.js",
        'plugins/parsleyjs/parsley.min.js',
        'site/users/index.js',
    ];

    res.render('admin/users/index', {
        baseUrl: server.adminBaseUrl,
        uriRoot: server.adminUriRoot,
        description: server.description,
        assetsVendorsRoot: server.assetsVendorsRoot,
        author: server.author,
        title: 'Users',
        styles,
        scripts,
        data: req.session.user,
    });
};

const listProc = (req, res, next) => {
    const params = req.query;
    let date = params.date;
    const getToday = params.getToday;
    if (!!getToday) {
        date = new Date();
        date = sprintf("%04d-%02d-%02d", date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
    let sql;
    if (!!date) {
        sql = sprintf("SELECT U.*, SUM(H.deltaAmount) `totalProfit` FROM `%s` U LEFT JOIN `%s` H ON H.userId = U.id AND H.prevAmount != 0 WHERE `signedUpDate` = '%s' GROUP BY U.id;", dbTblName.users, dbTblName.bitmex_wallet_history, date);
    } else {
        sql = sprintf("SELECT U.*, SUM(H.deltaAmount) `totalProfit` FROM `%s` U LEFT JOIN `%s` H ON H.userId = U.id AND H.prevAmount != 0 GROUP BY U.id;", dbTblName.users, dbTblName.bitmex_wallet_history);
    }
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
                data: [],
            });
            return;
        }
        let row;
        let signedUpDate;
        for (row of result) {
            // row['totalProfit'] = Math.round(Math.random() * 5000 + 1000);
            row['totalProfit'] = row['totalProfit'] / 100000000;
            signedUpDate = new Date(row['signedUpDate']);
            row['signedUpDate'] = sprintf('%02d/%02d/%04d', signedUpDate.getMonth() + 1, signedUpDate.getDate(), signedUpDate.getFullYear());
        }
        res.status(200).send({
            result: strings.success,
            data: result,
        });
    });
};

const editProc = (req, res, next) => {
    const params = req.body;
    const id = params.id;
    const email = params.email;
    const username = params.username;
    const activeTrading = params.activeTrading;

    let sql = sprintf("SELECT `id` FROM `%s` WHERE `id` != '%d' AND `username` = '%s';", dbTblName.users, id, username);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
            });
            return;
        }
        if (!result || result.length === 0) {
            sql = sprintf("UPDATE `%s` SET `email` = '%s', `username` = '%s', `activeTrading` = '%d' WHERE `id` = '%d';", dbTblName.users, email, username, activeTrading, id);
            dbConn.query(sql, null, (error, result, fields) => {
                if (error) {
                    console.log(error);
                    res.status(200).send({
                        result: strings.error,
                        message: strings.unknownServerError,
                    });
                } else {
                    res.status(200).send({
                        result: strings.success,
                        message: strings.successfullySaved,
                    });
                }
            });
        } else {
            res.status(200).send({
                result: strings.error,
                message: strings.usernameAlreadyRegistered,
            });
        }
    });

};

const passwordProc = (req, res, next) => {
    const params = req.body;
    const id = params.id;
    // const oldPassword = params.oldPassword;
    const password = params.password;
    // const oldHash = myCrypto.hmacHex(oldPassword);
    const hash = myCrypto.hmacHex(password);

    let sql = sprintf("UPDATE `%s` SET `password` = '%s' WHERE `id` = '%d';", dbTblName.users, hash, id);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
            });
        } else {
            res.status(200).send({
                result: strings.success,
                message: strings.successfullyChanged,
            });
        }
    });
};

const deleteProc = (req, res, next) => {
    const params = req.body;
    const id = params.id;
    let sql = sprintf("DELETE FROM `%s` WHERE `id` = '%d';", dbTblName.users, id);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
            });
        } else {
            res.status(200).send({
                result: strings.success,
                message: strings.successfullyDeleted,
            });
        }
    });
};

router.get('/', indexProc);
router.get('/list', listProc);
router.put('/edit', editProc);
router.post('/password', passwordProc);
router.delete('/delete', deleteProc);

module.exports = router;
