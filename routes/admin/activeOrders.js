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
        'site/active-orders/index.css',
    ];
    const scripts = [
        'plugins/datatables/jquery.dataTables.min.js',
        'plugins/datatables/dataTables.bootstrap4.min.js',
        'plugins/datatables/dataTables.buttons.min.js',
        'plugins/datatables/buttons.bootstrap4.min.js',
        'plugins/datatables/dataTables.responsive.min.js',
        'plugins/datatables/responsive.bootstrap4.min.js',
        server.assetsVendorsRoot + 'socket.io/socket.io.js',
        server.assetsVendorsRoot + 'sprintf.js/sprintf.min.js',
        'site/active-orders/index.js',
    ];
    let sql = sprintf("SELECT * FROM `%s`;", dbTblName.users);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            res.render('admin/activeOrders/index', {
                baseUrl: server.adminBaseUrl,
                uriRoot: server.adminUriRoot,
                description: server.description,
                assetsVendorsRoot: server.assetsVendorsRoot,
                author: server.author,
                title: 'Active Orders',
                socketUrl: server.userBaseUrl,
                styles,
                scripts,
                users: [],
            });
        } else {
            res.render('admin/activeOrders/index', {
                baseUrl: server.adminBaseUrl,
                uriRoot: server.adminUriRoot,
                description: server.description,
                assetsVendorsRoot: server.assetsVendorsRoot,
                author: server.author,
                title: 'Active Orders',
                socketUrl: server.userBaseUrl,
                styles,
                scripts,
                users: result,
            });
        }
    });
};

router.get('/', indexProc);

module.exports = router;
