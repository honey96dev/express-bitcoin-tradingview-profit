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

    let sql = sprintf("SELECT * FROM `%s`;", dbTblName.bitmex_settings);

    dbConn.query(sql, null, (error, result, fields) => {
        let properties = {};
        if (!error) {
            for (let row of result) {
                properties[row.property] = row.value;
            }
        }
        res.render('admin/settings/index', {
            baseUrl: server.adminBaseUrl,
            uriRoot: server.adminUriRoot,
            description: server.description,
            assetsVendorsRoot: server.assetsVendorsRoot,
            author: server.author,
            title: 'Settings',
            styles,
            scripts,
            data: properties,
        });
    });

};

const savePropertiesProc = (req, res, next) => {
    const params = req.body;
    const data = JSON.parse(params.data);

    let settings = [];
    Object.entries(data).forEach((entry) => {
        settings.push(entry);
    });

    let sql = sprintf("INSERT INTO `%s` VALUES ? ON DUPLICATE KEY UPDATE `property` = VALUES(`property`), `value` = VALUES(`value`);", dbTblName.bitmex_settings);
    console.log(sql, settings);
    // let sql = "INSERT INTO `bitmex_settings` VALUES ? ON DUPLICATE KEY UPDATE `property` = VALUES(`property`), `value` = VALUES(`value`);";
    dbConn.query(sql, [settings], (error, result, fields) => {
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
