import express from 'express';
import {server, dbTblName} from '../../core/config';
import dbConn from '../../core/dbConn';
import strings from '../../core/strings';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const styles = [
        'plugins/datatables/dataTables.bootstrap4.min.css',
        'plugins/datatables/buttons.bootstrap4.min.css',
        'plugins/datatables/responsive.bootstrap4.min.css',
        'site/signals/index.css',
    ];
    const scripts = [
        'plugins/datatables/jquery.dataTables.min.js',
        'plugins/datatables/dataTables.bootstrap4.min.js',
        'plugins/datatables/dataTables.buttons.min.js',
        'plugins/datatables/buttons.bootstrap4.min.js',
        'plugins/datatables/dataTables.responsive.min.js',
        'plugins/datatables/responsive.bootstrap4.min.js',
        'site/signals/index.js',
    ];

    res.render('admin/signals/index', {
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

    let sql = sprintf("SELECT * FROM `%s` ORDER BY `time`;", dbTblName.autoview_data);

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

        res.status(200).send({
            result: strings.success,
            data: result,
        });
    });
};

router.get('/', indexProc);
router.get('/list', listProc);

module.exports = router;
