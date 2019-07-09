import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import myCrypto from '../../core/myCrypto';
import strings from '../../core/strings';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const styles = [
        'site/dashboard/index.css',
    ];
    const scripts = [
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

router.get('/', indexProc);

module.exports = router;
