import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import myCrypto from '../../core/myCrypto';
import strings from '../../core/strings';
import {sprintf} from 'sprintf-js';
import numeral from 'numeral';

const router = express.Router();

const indexProc = (req, res, next) => {
    const styles = [
        'plugins/datatables/dataTables.bootstrap4.min.css',
        'plugins/datatables/buttons.bootstrap4.min.css',
        '//fonts.googleapis.com/css?family=Rubik:300,400&display=swap',
        'plugins/datatables/responsive.bootstrap4.min.css',
        server.assetsVendorsRoot + 'fontawesome-free-5.9.0-web/css/all.min.css',
        'site/dashboard/index.css',
    ];
    const scripts = [
        'plugins/datatables/jquery.dataTables.min.js',
        'plugins/datatables/dataTables.bootstrap4.min.js',
        'plugins/datatables/dataTables.buttons.min.js',
        'plugins/datatables/buttons.bootstrap4.min.js',
        'plugins/datatables/dataTables.responsive.min.js',
        'plugins/datatables/responsive.bootstrap4.min.js',
        'site/dashboard/index.js',
    ];
    res.render('admin/dashboard/index', {
        baseUrl: server.adminBaseUrl,
        uriRoot: server.adminUriRoot,
        description: server.description,
        assetsVendorsRoot: server.assetsVendorsRoot,
        author: server.author,
        title: 'Dashboard',
        styles,
        scripts,
    });
};

const activeBotsProc = (req, res, next) => {
    let sql = sprintf("SELECT A.* FROM `%s` A WHERE A.activeTrading = '1';", dbTblName.users);

    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);

            res.status(200).send({
                result: strings.error,
                data: [],
                error: error,
            });
        } else {
            res.status(200).send({
                result: strings.success,
                data: result,
            })
        }
    });
};

const dailyProfitProc = (req, res, next) => {
    let today = new Date();
    today = sprintf("%04d-%02d-%02d", today.getFullYear(), today.getMonth() + 1, today.getDate());
    let sql = sprintf("SELECT SUM(`deltaAmount`) `profit` FROM `%s` WHERE `prevAmount` != 0 AND `timestamp` LIKE '%s%s';", dbTblName.bitmex_wallet_history, today, '%');

    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);

            res.status(200).send({
                result: strings.error,
                data: 0,
                error: error,
            });
        } else {
            res.status(200).send({
                result: strings.success,
                data: numeral(result[0]['profit'] / 100000000).format('0,0.000000'),
            })
        }
    });
};

const dailyTradesProc = (req, res, next) => {
    let today = new Date();
    today = sprintf("%04d-%02d-%02d", today.getFullYear(), today.getMonth() + 1, today.getDate());
    let sql = sprintf("SELECT * FROM `%s` WHERE `timestamp` LIKE '%s%s';", dbTblName.bitmex_orders, today, '%s');
    // console.log('dailyTradesProc', sql);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);

            res.status(200).send({
                result: strings.error,
                data: [],
                error: error,
            });
        } else {
            res.status(200).send({
                result: strings.success,
                data: result,
            })
        }
    });
};

router.get('/', indexProc);
router.get('/active-bots', activeBotsProc);
router.get('/daily-profit', dailyProfitProc);
router.get('/daily-trades', dailyTradesProc);

module.exports = router;
