import express from 'express';
import {dbTblName} from '../../core/config';
import strings from '../../core/strings';
import dbConn from '../../core/dbConn';
import {BitMEXApi, POST} from '../../core/BitmexApi';
import {sprintf} from 'sprintf-js';

const router = express.Router();

const indexProc = (req, res, next) => {
    const params = req.body;
    const strategy = params.strategy;
    let action = params.position;
    if (typeof strategy === 'undefined' || typeof action != 'string') {
        res.status(200).send({
            result: strings.error,
            message: strings.invalidParameters,
        });
        return;
    }
    action = action.toLowerCase();

    const symbol = 'XBTUSD';

    const json = JSON.stringify(params);
    let time = new Date();
    time = sprintf("%04d-%02d-%02d %02d:%02d:%02d", time.getFullYear(), time.getMonth() + 1, time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());

    let sql = sprintf("SELECT `value` FROM `%s` WHERE `property` = '%s';", dbTblName.bitmex_settings, 'strategy');
    dbConn.query(sql, null, (error, strategies, fields) => {
        if (error) {
            console.log(error);
            sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.failedDueToUnknownServerError);
            dbConn.query(sql, null, (error, result, fields) => {});
            res.status(200).send({
                result: strings.error,
                message: strings.unknownServerError,
            });
            return;
        }

        if (strategies.length === 0) {
            console.error(strings.noStrategy);
            sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.noStrategy);
            dbConn.query(sql, null, (error, result, fields) => {});
            res.status(200).send({
                result: strings.error,
                message: strings.noStrategy,
            });
            return;
        } else if (strategies[0]['value'] != strategy) {
            console.error(strings.strategyIsMismatch);
            sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.strategyIsMismatch);
            dbConn.query(sql, null, (error, result, fields) => {});
            res.status(200).send({
                result: strings.error,
                message: strings.strategyIsMismatch,
            });
            return;
        }

        sql = sprintf("SELECT * FROM `%s` WHERE `activeTrading` = '%d' AND `bitmexApikey` != '' AND `bitmexApikeySecret` != '';", dbTblName.users, 1);
        dbConn.query(sql, null, (error, users, fields) => {
            if (error) {
                console.log(error);
                sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.failedDueToUnknownServerError);
                dbConn.query(sql, null, (error, result, fields) => {});
                res.status(200).send({
                    result: strings.error,
                    message: strings.unknownServerError,
                });
                return;
            }

            for (let user of users) {
                let testnet = user['bitmexTestnet'];
                let apiKeyID = user['bitmexApikey'];
                let apiKeySecret = user['bitmexApikeySecret'];
                let bitMEXApi = new BitMEXApi(testnet, apiKeyID, apiKeySecret);

                let filter = JSON.stringify({symbol: symbol});
                bitMEXApi.position({filter: filter}, (positions) => {
                    // console.log('position', testnet, apiKeyID, apiKeySecret, JSON.stringify(positions));
                    let currentQty;
                    let ordType;
                    let side;
                    for (let position of positions) {
                        currentQty = position['currentQty'];
                        // console.log(strategy, action, currentQty);
                        if (action === 'buy') {
                            ordType = 'Market';
                            side = 'Buy';
                            if (currentQty > 0) {
                                console.log('Ignore buy due to long position');
                                continue;
                            } else if (currentQty < 0 && position['isOpen']) {
                                bitMEXApi.orderClosePosition({symbol: symbol}, (result) => {
                                    orderProc(bitMEXApi, ordType, symbol, side);
                                }, (error) => {
                                    console.error('orderClosePosition', testnet, apiKeyID, apiKeySecret, error);
                                })
                            } else {
                                orderProc(bitMEXApi, ordType, symbol, side);
                            }
                        } else if (action === 'sell') {
                            ordType = 'Market';
                            side = 'Sell';
                            if (currentQty < 0) {
                                console.log('Ignore sell due to short position');
                                continue;
                            } else if (currentQty > 0 && position['isOpen']) {
                                bitMEXApi.orderClosePosition({symbol: symbol}, (result) => {
                                    orderProc(bitMEXApi, ordType, symbol, side);
                                }, (error) => {
                                    console.error('orderClosePosition', testnet, apiKeyID, apiKeySecret, error);
                                })
                            } else {
                                orderProc(bitMEXApi, ordType, symbol, side);
                            }
                        }
                    }
                }, (error) => {
                    console.error('position', testnet, apiKeyID, apiKeySecret, error);
                });
            }
            sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.tradesPerformedSuccessfully);
            dbConn.query(sql, null, (error, result, fields) => {
                if (error) {
                    console.log(error);
                    sql = sprintf("INSERT INTO `%s`(`time`, `text`, `perform`) VALUES('%s', '%s', '%s');", dbTblName.autoview_data, time, json, strings.failedDueToUnknownServerError);
                    dbConn.query(sql, null, (error, result, fields) => {});
                    res.status(200).send({
                        result: strings.error,
                        message: strings.unknownServerError,
                    });
                    return;
                }
                res.status(200).send({
                    result: strings.success,
                });
            });
        });

    });
};

let orderTimeoutId = null;
const orderTimeoutDelay = 1000;
const orderProc = (bitMEXApi, ordType, symbol, side) => {
    if (orderTimeoutId) {
        clearTimeout(orderTimeoutId);
    }
    if (!(bitMEXApi instanceof BitMEXApi)) {
        console.error('BitMEXApi is invalid');
        return false;
    }

    const sideSell = 'Sell';
    const sideBuy = 'Buy';

    bitMEXApi.orderAll({symbol: symbol}, (result) => {

        let sql = sprintf("SELECT * FROM `%s` WHERE `property` != '%s';", dbTblName.bitmex_settings, 'strategy');
        dbConn.query(sql, null, (error, rows, fields) => {
            if (error) {
                console.error(error);
                orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
                return;
            }
            let bitMEXSettings = {
                minWallet: 0,
                percentStopLoss: 5,
                percentTakeProfit: 5,
                percentWallet: 0,
                profitPerTrade: 5,
            };
            for (let row of rows) {
                bitMEXSettings[row['property']] = row['value'];
            }
            // console.log('BitMEX-settings', JSON.stringify(bitMEXSettings));
            bitMEXApi.userWallet({currency: 'XBt'}, (wallet) => {
                // console.log('wallet', JSON.stringify(wallet));
                const satoshi2Bitcoin = 100000000;
                let walletAmount = wallet['amount'] / satoshi2Bitcoin;
                if (walletAmount < bitMEXSettings['minWallet']) {
                    console.error('Wallet amount is lower than minimum amount of wallet');
                    return;
                }
                bitMEXApi.trade({symbol: symbol, side: 'Buy', reverse: true}, (trades) => {
                    // console.log('trades', JSON.stringify(trades[0]));
                    const price = trades[0]['price'];
                    const balance = walletAmount * price;

                    let orderQty;
                    orderQty = Math.round(balance * bitMEXSettings['percentWallet']);
                    console.log('orderQty', walletAmount, price, bitMEXSettings['percentWallet'], orderQty);
                    bitMEXApi.order(POST, {symbol: symbol, orderQty: orderQty, ordType: ordType, side: side}, (result) => {
                        console.log(ordType, walletAmount, price, bitMEXSettings['percentWallet'], orderQty);

                        // orderQty = Math.round(balance * bitMEXSettings['percentTakeProfit']);
                        let stopPx;
                        // stopPx = Math.round(price * (1 + bitMEXSettings['percentTakeProfit'] / 100));
                        stopPx = Math.round(price + balance * bitMEXSettings['percentTakeProfit']);
                        bitMEXApi.order(POST, {symbol: symbol, orderQty: orderQty, side: sideSell, ordType: "MarketIfTouched", execInst: "Close,LastPrice", stopPx: stopPx}, (result) => {
                            console.log('Take Profit Market', walletAmount, price, stopPx, bitMEXSettings['percentTakeProfit'], orderQty);
                        }, (error) => {
                            console.error(error);
                            orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
                        });

                        // orderQty = Math.round(balance * bitMEXSettings['percentStopLoss']);
                        // stopPx = Math.round(price * (1 - bitMEXSettings['percentStopLoss'] / 100));
                        stopPx = Math.round(price - balance * bitMEXSettings['percentStopLoss']);
                        bitMEXApi.order(POST, {symbol: symbol, orderQty: orderQty, side: sideSell, ordType: "Stop", execInst: "Close,LastPrice", stopPx: stopPx}, (result) => {
                            console.log('Stop Loss', walletAmount, price, stopPx, bitMEXSettings['percentStopLoss'], orderQty);
                        }, (error) => {
                            console.error(error);
                            orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
                        });
                    }, (error) => {
                        console.error(error);
                        orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
                    });
                }, (error) => {
                    console.error(error);
                    orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
                });
            }, (error) => {
                console.error(error);
                orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
            });
        });
    }, (error) => {
        console.error(error);
        orderTimeoutId = setTimeout(orderProc, orderTimeoutDelay, bitMEXApi, ordType, symbol, side);
    });
};

// const stopOrderProc = (symbol, orderQty, price, )

const sellProc = (bitMEXApi, type, symbol) => {
    if (!(bitMEXApi instanceof BitMEXApi)) {
        return false;
    }
    // bitMEXApi.
};

router.post('/', indexProc);

module.exports = router;
