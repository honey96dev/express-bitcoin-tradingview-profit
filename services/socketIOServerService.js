import config, {dbTblName} from '../core/config';
import dbConn from '../core/dbConn';
import {BitMEXApi} from '../core/BitmexApi';
import sprintfJs from 'sprintf-js';
import {DELETE} from "../core/BitmexApi";
import request from "request";

let service = {
    ioServer: undefined,
    // clients: [],
    wallets: {},
    positions: {},
    orders: {},
    serveAccountIds: {},
    walletsClientSockets: [],
    positionsClientSockets: [],
    ordersClientSockets: [],
    bitmexSocket: undefined,

    initSocketIOServer: (ioServer) => {
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
                            order.orderQty,
                            order.stopPx,
                            order.ordStatus,
                        ]);

                        if (order.ordType == 'Stop' && order.ordStatus == 'Filled') {
                            let sql = sprintfJs.sprintf("SELECT * FROM `%s` WHERE `id` = '%d';", dbTblName.users, key);
                            dbConn.query(sql, null, (error, result, fields) => {
                                if (error || result.length === 0) {
                                    console.log('Invalid user data');
                                    return;
                                }
                                const row = result[0];
                                let bitMEXApi = new BitMEXApi(row.bitmexTestnet, row.bitmexApikey, row.bitmexApikeySecret);
                                let filter = JSON.stringify({ordType: "MarketIfTouched"});
                                bitMEXApi.orderAll({symbol: 'XBTUSD', filter: filter}, (result) => {
                                    console.log('Take profit canceled due to no position');
                                }, (error) => {
                                    console.log(error);
                                });
                            });
                        }
                        if (order.ordType == 'MarketIfTouched' && order.ordStatus == 'Filled') {
                            let sql = sprintfJs.sprintf("SELECT * FROM `%s` WHERE `id` = '%d';", dbTblName.users, key);
                            dbConn.query(sql, null, (error, result, fields) => {
                                if (error || result.length === 0) {
                                    console.log('Invalid user data');
                                    return;
                                }
                                const row = result[0];
                                let bitMEXApi = new BitMEXApi(row.bitmexTestnet, row.bitmexApikey, row.bitmexApikeySecret);
                                let filter = JSON.stringify({ordType: "Stop"});
                                bitMEXApi.orderAll({symbol: 'XBTUSD', filter: filter}, (result) => {
                                    console.log('Stop loss canceled due to no position');
                                }, (error) => {
                                    console.log(error);
                                });
                            });
                        }
                    }
                    if (dbValues.length > 0) {
                        let sql = sprintfJs.sprintf("INSERT INTO `%s`(`orderID`, `timestamp`, `userId`, `ordType`, `orderQty`, `stopPx`, `ordStatus`) VALUES ? ON DUPLICATE KEY UPDATE `timestamp` = VALUES(`timestamp`), `userId` = VALUES(`userId`), `ordType` = VALUES(`ordType`), `stopPx` = VALUES(`stopPx`), `ordStatus` = VALUES(`ordStatus`);", dbTblName.bitmex_orders);
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

            socket.on('restartBitmex', (data) => {
                service.bitmexSocket.emit('restartBitmex');
            });
        });
    },

    remakeAllSockets: () => {
        service.ioServer.emit('remakeAllSocket');
    }
};

module.exports = service;
