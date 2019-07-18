import express from 'express';
import {dbTblName} from '../../core/config';
import strings from '../../core/strings';
import dbConn from '../../core/dbConn';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const params = req.body;
    let sql = sprintf("SELECT * FROM `%s`;", dbTblName.bitmex_settings);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            res.status(200).send({
                result: strings.error,
                data: [],
            });
        } else {
            res.status(200).send({
                result: strings.success,
                data: result,
            });
        }
    });
};

router.get('/', indexProc);

module.exports = router;
