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
    let count = Math.round(Math.random() * 100);
    let items = [];
    for (let i = 0; i < count; i ++) {
        items.push({
            email: '',
            username: '',
            bitmexApiKey: '',
            bitmexApikeySecret: '',
            bitmexTestnet: '',
        });
    }
    res.status(200).send({
        result: 'success',
        data: items,
    });
};

const dailyProfitProc = (req, res, next) => {
    let profit = Math.round(Math.random() * 50000 + 1000);
    // profit = numeral(profit).format('$ 0,0.00');
    profit = numeral(profit).format('0,0.00');

    res.status(200).send({
        result: 'success',
        data: profit,
    });
};

const dailyTradesProc = (req, res, next) => {
    let trades = Math.round(Math.random() * 50 + 10);

    res.status(200).send({
        result: 'success',
        data: trades,
    });
};

router.get('/', indexProc);
router.get('/activeBots', activeBotsProc);
router.get('/dailyProfit', dailyProfitProc);
router.get('/dailyTrades', dailyTradesProc);

module.exports = router;
