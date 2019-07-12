import express from 'express';
import {server, dbTblName} from '../../core/config';
import strings from '../../core/strings';
import dbConn from '../../core/dbConn';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const params = req.body;
    const json = JSON.stringify(params);
    let time = new Date();
    time = sprintf("%04d-%02d-%02d %02d:%02d:%02d", time.getFullYear(), time.getMonth() + 1, time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
    let sql = sprintf("INSERT INTO `autoview_data`(`time`, `text`) VALUES('%s', '%s');", time, json);
    dbConn.query(sql, null, (error, result, fields) => {
        if (error) {
            console.log(error);
            res.status(200).send({
                result: strings.error,
            });
        } else {
            res.status(200).send({
                result: strings.success,
            });
        }
    });
};

router.post('/', indexProc);

module.exports = router;
