import config, {dbTblName} from '../core/config';
import dbConn from '../core/dbConn';
import {BitMEXApi, POST} from '../core/BitmexApi';
import sprintfJs, {sprintf} from 'sprintf-js';
import {DELETE} from "../core/BitmexApi";
import strings from '../core/strings';
import request from "request";

let service = {
    ioServer: undefined,
    // clients: [],
    accounts: {},
    wallets: {},
    positions: {},
    orders: {},
    serveAccountIds: {},
    walletsClientSockets: [],
    positionsClientSockets: [],
    ordersClientSockets: [],
    bitmexSocket: undefined,
    xbtUsdPrice: 0,

    initSocketIOServer: (ioServer) => {
        monitorPosition();

        service.ioServer = ioServer;
        // service.ioServer.on('ping', (data) => {
        //     console.log('ping', data);
        // });
        service.walletsClientSockets = [];
        service.positionsClientSockets = [];

        service.ioServer.on('connection', (socket) => {
            // service.clients.push(socket);
            // console.log('connection', socket.id);
            service.serveAccountIds[socket.id] = [];
            socket.on('alive?', (data) => {
                socket.emit('alive', socket.id);
                console.log('alive?', socket.id, data);
            });

            socket.on('bitmexService', (data) => {
                service.bitmexSocket = socket;
            });

            socket.on('requestAccounts', (data) => {
                service.serveAccountIds[socket.id] = JSON.parse(data);
                // console.warn('requestAccounts', socket.id, data, service.serveAccountIds);
            });

            socket.on('wallets?', (data) => {
                service.walletsClientSockets.push(socket);
                // console.log(service.walletsClientSockets.length);
            });

            socket.on('positions?', (data) => {
                service.positionsClientSockets.push(socket);
                // console.log(service.positionsClientSockets.length);
            });

            socket.on('orders?', (data) => {
                service.ordersClientSockets.push(socket);
                let clientIds = [];
                for (let item of service.ordersClientSockets) {
                    clientIds.push(item.id);
                }
                // console.log('service.ordersClientSockets', clientIds);
            });

            socket.on('wallets??', (data) => {
                let ioData = {};
                for (let accountId of service.serveAccountIds[socket.id]) {
                    if (typeof service.wallets[accountId] !== 'undefined') {
                        ioData[accountId] = service.wallets[accountId];
                    }
                }
                socket.emit('wallets', ioData);
            });

            socket.on('positions??', (data) => {
                let ioData = {};
                for (let accountId of service.serveAccountIds[socket.id]) {
                    if (typeof service.positions[accountId] !== 'undefined') {
                        ioData[accountId] = service.positions[accountId];
                    }
                }
                socket.emit('positions', ioData);
            });

            socket.on('orders??', (data) => {
                let ioData = {};
                for (let accountId of service.serveAccountIds[socket.id]) {
                    if (typeof service.orders[accountId] !== 'undefined') {
                        ioData[accountId] = service.orders[accountId];
                    }
                }
                socket.emit('orders', ioData);
            });

            socket.on('wallets', (data) => {
                // console.log('wallets', data);
                const json = JSON.parse(data);

                service.wallets = {};
                //
                // let dbValues = [];
                Object.entries(json).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];
                    // Object.entries(value).forEach(entry => {
                    //     let key1 = entry[0];
                    //     let value1 = entry[1];
                    //     service.wallets.push(value1);
                    // });
                    service.wallets[value.accountId] = value;
                    // dbValues.push([
                    //     sprintfJs.sprintf("%s:%s", value.timestamp, value.accountId),
                    //     value.timestamp,
                    //     value.accountId,
                    //     value.prevAmount,
                    //     value.amount,
                    //     value.deltaAmount
                    // ])
                });
                //
                // if (dbValues.length > 0) {
                //     let sql = sprintfJs.sprintf("INSERT INTO `%s`(`id`, `timestamp`, `userId`, `prevAmount`, `amount`, `deltaAmount`) VALUES ? ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `timestamp` = VALUES(`timestamp`), `userId` = VALUES(`userId`), `prevAmount` = VALUES(`prevAmount`), `amount` = VALUES(`amount`), `deltaAmount` = VALUES(`deltaAmount`);", dbTblName.bitmex_wallet_history);
                //     dbConn.query(sql, [dbValues], (error, result, fields) => {
                //         if (error) {
                //             console.log(error);
                //         }
                //     });
                // }
                Object.entries(json).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];
                    let bitMEXApi = new BitMEXApi(value.testnet, value.apiKeyID, value.apiKeySecret);
                    bitMEXApi.userWalletHistory({start: 0, count: 1000000, reverse: false}, (result) => {
                        let dbValues = [];
                        let prevBalance = 0;
                        const cnt = result.length;
                        let item;
                        for (let i = cnt - 1; i >= 0; i--) {
                            item = result[i];
                            if (item.timestamp == null || item.timestamp === undefined) continue;
                            dbValues.push([
                                sprintfJs.sprintf("%s:%s", item.timestamp, value.accountId),
                                item.timestamp,
                                value.accountId,
                                prevBalance,
                                item.walletBalance,
                                item.walletBalance - prevBalance
                            ]);
                            prevBalance = item.walletBalance;
                        }
                        if (dbValues.length > 0) {
                            let sql = sprintfJs.sprintf("INSERT INTO `%s`(`id`, `timestamp`, `userId`, `prevAmount`, `amount`, `deltaAmount`) VALUES ? ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `timestamp` = VALUES(`timestamp`), `userId` = VALUES(`userId`), `prevAmount` = VALUES(`prevAmount`), `amount` = VALUES(`amount`), `deltaAmount` = VALUES(`deltaAmount`);", dbTblName.bitmex_wallet_history);
                            dbConn.query(sql, [dbValues], (error, result, fields) => {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        }
                    }, (error) => {
                        console.log(error);
                    });
                });

                for (let client of service.walletsClientSockets) {
                    let ioData = {};
                    for (let accountId of service.serveAccountIds[client.id]) {
                        if (typeof service.wallets[accountId] !== 'undefined') {
                            ioData[accountId] = service.wallets[accountId];
                        }
                    }
                    client.emit('wallets', ioData);
                }
                // console.error('wallets', JSON.stringify(service.wallets));
            });

            socket.on('positions', (data) => {
                // console.log(data);
                const json = JSON.parse(data);

                service.positions = {};
                Object.entries(json).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];
                    let symbols = [];
                    Object.entries(value).forEach(entry => {
                        let key1 = entry[0];
                        let value1 = entry[1];
                        if (value1.isOpen) {
                            if (!key1.includes('accountId')) {
                                symbols.push(value1);
                            }
                        }
                    });
                    service.positions[value.accountId] = symbols;
                    service.accounts[value.accountId] = {
                        testnet: value.testnet,
                        apiKeyID: value.apiKeyID,
                        apiKeySecret: value.apiKeySecret,
                    }
                });


                for (let client of service.positionsClientSockets) {
                    // console.log('positions', client.id, service.serveAccountIds);
                    let ioData = {};
                    for (let accountId of service.serveAccountIds[client.id]) {
                        if (typeof service.positions[accountId] !== 'undefined') {
                            ioData[accountId] = service.positions[accountId];
                        }
                    }
                    client.emit('positions', ioData);
                }
                // console.log('positions', JSON.stringify(service.positions));
            });

            socket.on('orders', (data) => {
                // let clientIds = [];
                // for (let item of service.ordersClientSockets) {
                //     clientIds.push(item.id);
                // }
                // console.error('orders', data);
                // console.log('service.ordersClientSockets', clientIds);
                service.orders = JSON.parse(data);

                Object.entries(service.orders).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];
                    let dbValues = [];
                    for (let order of value) {
                        dbValues.push([
                            order.orderID,
                            order.timestamp,
                            key,
                            order.ordType,
                            order.side,
                            order.orderQty,
                            service.xbtUsdPrice,
                            order.stopPx,
                            order.ordStatus,
                        ]);
                        //
                        // if (order.ordType == 'Stop' && order.ordStatus == 'Filled') {
                        //     let sql = sprintfJs.sprintf("SELECT * FROM `%s` WHERE `id` = '%d';", dbTblName.users, key);
                        //     dbConn.query(sql, null, (error, result, fields) => {
                        //         if (error || result.length === 0) {
                        //             console.log('Invalid user data');
                        //             return;
                        //         }
                        //         const row = result[0];
                        //         let bitMEXApi = new BitMEXApi(row.bitmexTestnet, row.bitmexApikey, row.bitmexApikeySecret);
                        //         let filter = JSON.stringify({ordType: "MarketIfTouched"});
                        //         bitMEXApi.orderAll({symbol: 'XBTUSD', filter: filter}, (result) => {
                        //             console.log('Take profit canceled due to no position');
                        //         }, (error) => {
                        //             console.log(error);
                        //         });
                        //     });
                        // }
                        // if (order.ordType == 'MarketIfTouched' && order.ordStatus == 'Filled') {
                        //     let sql = sprintfJs.sprintf("SELECT * FROM `%s` WHERE `id` = '%d';", dbTblName.users, key);
                        //     dbConn.query(sql, null, (error, result, fields) => {
                        //         if (error || result.length === 0) {
                        //             console.log('Invalid user data');
                        //             return;
                        //         }
                        //         const row = result[0];
                        //         let bitMEXApi = new BitMEXApi(row.bitmexTestnet, row.bitmexApikey, row.bitmexApikeySecret);
                        //         let filter = JSON.stringify({ordType: "Stop"});
                        //         bitMEXApi.orderAll({symbol: 'XBTUSD', filter: filter}, (result) => {
                        //             console.log('Stop loss canceled due to no position');
                        //         }, (error) => {
                        //             console.log(error);
                        //         });
                        //     });
                        // }
                    }
                    if (dbValues.length > 0) {
                        let sql = sprintfJs.sprintf("INSERT INTO `%s`(`orderID`, `timestamp`, `userId`, `ordType`, `side`, `orderQty`, `price`, `stopPx`, `ordStatus`, `text`) VALUES ? ON DUPLICATE KEY UPDATE `timestamp` = VALUES(`timestamp`), `userId` = VALUES(`userId`), `ordType` = VALUES(`ordType`), `side` = VALUES(`side`), `orderQty` = VALUES(`orderQty`), `price` = VALUES(`price`), `stopPx` = VALUES(`stopPx`), `ordStatus` = VALUES(`ordStatus`), `text` = VALUES(`text`);", dbTblName.bitmex_orders);
                        // console.log('order', sql, JSON.stringify(dbValues));
                        dbConn.query(sql, [dbValues], (error, result, fields) => {
                            if (error) {
                                console.log(error);
                            }
                        });
                    }
                });

                for (let client of service.ordersClientSockets) {
                    // console.log('service.serveAccountIds', client.id, service.serveAccountIds[client.id]);
                    let ioData = {};
                    for (let accountId of service.serveAccountIds[client.id]) {
                        // console.log('service.orders', accountId, JSON.stringify(service.orders[accountId]));
                        if (typeof service.orders[accountId] !== 'undefined') {
                            ioData[accountId] = service.orders[accountId];
                        }
                    }
                    // console.log('orders emit', client.id, JSON.stringify(ioData));
                    client.emit('orders', ioData);
                }
            });

            socket.on('cancelOrder', (data) => {
                const params = JSON.parse(data);
                let sql = sprintfJs.sprintf("SELECT * FROM `bitmex_accounts` WHERE BINARY `id` = '%d';", params.accountId);
                dbConn.query(sql, null, (error, results, fields) => {
                    if (error) {
                        return;
                    }
                    if (typeof results === 'undefined' || results.length === 0) {
                        return;
                    }
                    const apkKeySet = results[0];
                    const headers = {
                        'content-type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'testnet': apkKeySet.testnet,
                        'apikeyid': apkKeySet.apiKeyID,
                        'apikeysecret': apkKeySet.apiKeySecret,
                    };
                    const body = JSON.stringify({
                        order: {
                            orderID: params.orderID,
                        },
                    });
                    const requestOptions = {
                        headers: headers,
                        url: config.server.baseUrl + 'rest/order',
                        method: DELETE,
                        body: body
                    };
                    request(requestOptions, undefined, (data) => {
                        console.log(data);
                    });
                });
            });

            socket.on('trade', (data) => {
                data = JSON.parse(data);
                if (data instanceof Array && data.length > 0) {
                    service.xbtUsdPrice = data[0]['price'];
                }
            });

            socket.on('restartBitmex', (data) => {
                service.bitmexSocket.emit('restartBitmex');
            });
        });
    },

    remakeAllSockets: () => {
        service.ioServer.emit('remakeAllSocket');
    }
};

let monitorTimerId = null;
let monitorTimerInterval = 10000;
const monitorPosition = () => {
    if (monitorTimerId) {
        clearTimeout(monitorTimerId);
    }
    monitorTimerId = setTimeout(monitorPosition, monitorTimerInterval);
    console.log('monitorPosition', 'start', JSON.stringify(service.positions));
    Object.entries(service.positions).forEach(entry => {
        let accountId = entry[0];
        let symbols = entry[1];
        let account = service.accounts[accountId];
        let orders = service.orders[accountId];
        if (!orders) {
            console.log(accountId, 'Orders are null');
            return;
        }
        let symbol = 'XBTUSD';
        let bitMEXApi = new BitMEXApi(account.testnet, account.apiKeyID, account.apiKeySecret);
        if (symbols.length === 0) {
            let flag = false;
            for (let order of orders) {
                if (order.ordStatus == 'New') {
                    flag = true;
                    break;
                }
            }
            if (flag > 0) {
                console.log(accountId, strings.allOrdersAreCanceledDueToNoPosition);
                bitMEXApi.orderAll({symbol: symbol});
            }
            return;
        }
        // console.log('orders', accountId, JSON.stringify(orders));
        let TPFlag = false;
        let SLFlag = false;
        let orderQty;
        let orderSide;
        let positionQty;
        let positionSign;
        let cancelFlag;
        for (let order of orders) {
            orderQty = Math.abs(order.orderQty);
            orderSide = order.side;
            positionSign = Math.sign(symbols[0]['currentQty']);
            positionQty = Math.abs(symbols[0]['currentQty']);
            cancelFlag = orderQty !== positionQty || (orderSide == 'Buy' && positionSign > 0) || (orderSide == 'Sell' && positionSign < 0);
            if (order.ordType == 'Stop' && order.ordStatus == 'New') {
                if (cancelFlag) {
                    console.log('S/L cancel due to orderQty', orderQty, positionQty);
                    bitMEXApi.order(DELETE, {orderID: order.orderID});
                }
                if (SLFlag == true) {
                    console.log('S/L cancel due to duplicated');
                    bitMEXApi.order(DELETE, {orderID: order.orderID});
                }
                SLFlag = true;
            } else if (order.ordType == 'MarketIfTouched' && order.ordStatus == 'New') {
                if (cancelFlag) {
                    console.log('T/P cancel due to orderQty', orderQty, positionQty);
                    bitMEXApi.order(DELETE, {orderID: order.orderID});
                }
                if (TPFlag == true) {
                    console.log('T/P cancel due to duplicated');
                    bitMEXApi.order(DELETE, {orderID: order.orderID});
                }
                TPFlag = true;
            }
        }
        // console.log('tp, sl', accountId, TPFlag, SLFlag);
        if (!TPFlag) {
            // console.log(accountId, 'takeProfitOrderProc');
            takeProfitOrderProc(bitMEXApi, symbol, accountId)
        }
        if (!SLFlag) {
            // console.log(accountId, 'stopLossOrderProc');
            stopLossOrderProc(bitMEXApi, symbol, accountId)
        }
        console.log('monitorPosition', accountId, 'done');
    });
    console.log('monitorPosition', 'end');
};

const stopLossOrderProc = (bitMEXApi, symbol, accountId) => {
    if (!(bitMEXApi instanceof BitMEXApi)) {
        console.error('BitMEXApi is invalid');
        return false;
    }

    const sideSell = 'Sell';
    const sideBuy = 'Buy';

    let sql = sprintf("SELECT * FROM `%s` WHERE `property` != '%s' UNION SELECT 'personalPercentWallet' `property`, `percentWallet` FROM `%s` WHERE `id` = '%d';", dbTblName.bitmex_settings, 'strategy', dbTblName.users, accountId);
    dbConn.query(sql, null, (error, rows, fields) => {
        if (error) {
            console.error(error);
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
        if (!!bitMEXSettings['personalPercentWallet'] && bitMEXSettings['personalPercentWallet'] > 0) {
            bitMEXSettings['percentWallet'] = bitMEXSettings['personalPercentWallet'];
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
                // let orderQty = service.positions[accountId][0]['currentQty'];
                let orderQty = service.positions[accountId][0]['currentQty'];
                const sign = Math.sign(orderQty);
                orderQty = Math.abs(orderQty);
                // console.log('positions', accountId, service.positions);
                const price = trades[0]['price'];
                const balance = walletAmount * price;

                // orderQty = Math.round(balance * bitMEXSettings['percentTakeProfit']);
                // let stopPx = Math.round(price - balance * bitMEXSettings['percentStopLoss']);
                let stopPx = Math.round(price * (1 - sign * bitMEXSettings['percentStopLoss'] / 100));
                bitMEXApi.order(POST, {
                    symbol: symbol,
                    orderQty: orderQty,
                    side: sign > 0 ? sideSell : sideBuy,
                    ordType: "Stop",
                    execInst: "Close,LastPrice",
                    stopPx: stopPx
                }, (result) => {
                    console.log('Stop Loss', walletAmount, price, stopPx, bitMEXSettings['percentStopLoss'], orderQty);
                }, (error) => {
                    console.error(error);
                });
            }, (error) => {
                console.error(error);
            });
        }, (error) => {
            console.error(error);
        });
    });
};

const takeProfitOrderProc = (bitMEXApi, symbol, accountId) => {
    if (!(bitMEXApi instanceof BitMEXApi)) {
        console.error('BitMEXApi is invalid');
        return false;
    }

    const sideSell = 'Sell';
    const sideBuy = 'Buy';

    let sql = sprintf("SELECT * FROM `%s` WHERE `property` != '%s' UNION SELECT 'personalPercentWallet' `property`, `percentWallet` FROM `%s` WHERE `id` = '%d';", dbTblName.bitmex_settings, 'strategy', dbTblName.users, accountId);
    dbConn.query(sql, null, (error, rows, fields) => {
        if (error) {
            console.error(error);
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
        if (!!bitMEXSettings['personalPercentWallet'] && bitMEXSettings['personalPercentWallet'] > 0) {
            bitMEXSettings['percentWallet'] = bitMEXSettings['personalPercentWallet'];
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
                let orderQty = service.positions[accountId][0]['currentQty'];
                const sign = Math.sign(orderQty);
                orderQty = Math.abs(orderQty);
                // console.log('trades', JSON.stringify(trades[0]));
                const price = trades[0]['price'];
                const balance = walletAmount * price;

                // orderQty = Math.round(balance * bitMEXSettings['percentTakeProfit']);
                // let stopPx = Math.round(price + balance * bitMEXSettings['percentTakeProfit']);
                let stopPx = Math.round(price * (1 + sign * bitMEXSettings['percentTakeProfit'] / 100));
                bitMEXApi.order(POST, {
                    symbol: symbol,
                    orderQty: orderQty,
                    side: sign > 0 ? sideSell : sideBuy,
                    ordType: "MarketIfTouched",
                    execInst: "Close,LastPrice",
                    stopPx: stopPx
                }, (result) => {
                    console.log('Take Profit Market', walletAmount, price, stopPx, bitMEXSettings['percentTakeProfit'], orderQty);
                }, (error) => {
                    console.error(error);
                });
            }, (error) => {
                console.error(error);
            });
        }, (error) => {
            console.error(error);
        });
    });
};

module.exports = service;
