import config from '../core/config';
import dbConn from '../core/dbConn';
import sprintfJs from 'sprintf-js';
import WebSocket from 'ws-reconnect';
import SocketIOClient from 'socket.io-client';
import request from 'request';
import crypto from 'crypto';
import {BitMEXApi, DELETE, GET, POST, PUT} from '../core/BitmexApi';
import _ from "lodash";

const map_to_object = map => {
    const object = {};
    map.forEach((value, key) => {
        if (value instanceof Map) {
            object[key] = map_to_object(value);
        } else {
            object[key] = value;
        }
    });
    return object;
};

const map_to_json = map => {
    const object = map_to_object(map);
    return JSON.stringify(object);
};

let service = {
    accounts: [],

    ioClient: undefined,
    wallets: new Map(),
    positions: new Map(),
    orders: new Map(),

    initSocketIOClient: () => {
        service.ioClient = SocketIOClient(config.server.userBaseUrl, {
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 4000,
            reconnectionAttempts: Infinity
        });
        service.ioClient.on('remakeAllSocket', (data) => {
            service.initFromDb(config.dbTblName.users, () => {
                service.wsOrder('XBTUSD');
                service.wsTrade('XBTUSD');
                service.wsOrderBookL2_25('XBTUSD');
                service.wsExecution('XBTUSD');
                service.wsWallet('*');
                service.wsPosition('XBTUSD');
            });
        });
        service.ioClient.on('connect', () => {
            console.log('socket-io', 'connect');
            service.ioClient.emit('bitmexService');
            service.ioClient.emit('wallets', map_to_json(service.wallets));
            service.ioClient.emit('positions', map_to_json(service.positions));
            service.ioClient.emit('orders', map_to_json(service.orders));
        });
        service.ioClient.on('wallets?', (data) => {
            // console.log('socket-io', 'wallets?');
            service.ioClient.emit('wallets', map_to_json(service.wallets));
        });
        service.ioClient.on('positions?', (data) => {
            // console.log('socket-io', 'positions?');
            service.ioClient.emit('positions', map_to_json(service.positions));
        });
        service.ioClient.on('orders?', (data) => {
            // console.log('socket-io', 'positions?');
            service.ioClient.emit('orders', map_to_json(service.orders));
        });
        service.ioClient.on('alive', (data) => {
            console.log('socket-io', 'alive', data);
        });
        service.ioClient.on('restartBitmex', (data) => {
            console.log('restartBitmex');
            service.initFromDb(config.dbTblName.users, (results) => {
                service.wsOrder('XBTUSD');
                service.wsTrade('XBTUSD');
                service.wsOrderBookL2_25('XBTUSD');
                service.wsExecution('XBTUSD');
                service.wsWallet('*');
                service.wsPosition('XBTUSD');
                // // BitMEXService.restPosition(GET, {}, (data) => {
                // //     console.log('restPosition', JSON.stringify(data));
                // // }, (error) => {
                // //     console.warn('restPosition', JSON.stringify(error));
                // // });
            });
        });

        // setInterval(() => {
        //     if (service.ioClient.connected) {
        //         console.log('alive?', new Date());
        //         service.ioClient.emit('alive?', 'this is test', new Date().getTime());
        //     }
        // }, 2000);
    },

    signMessage: (secret, verb, url, nonce, data) => {
        if (!data || _.isEmpty(data)) data = '';
        else if (_.isObject(data)) data = JSON.stringify(data);

        return crypto.createHmac('sha256', secret).update(verb + url + nonce + data).digest('hex');
    },

    renewSocket: (account) => {
        const timestamp = new Date().getTime();
        if (account.renewSocketTimeoutId) {
            clearTimeout(account.renewSocketTimeoutId);
        }
        account.renewSocketTimeoutId = setTimeout(service.renewSocket, 30000, account);
        if (account.lastTimestamp > timestamp - 30000) {
            console.warn('renewSocket-still alive', account.id);
            return;
        }
        const wsUrl = Boolean(account.testnet) ? 'wss://testnet.bitmex.com/realtime' : 'wss://www.bitmex.com/realtime';
        if (account.apiKeyID.length === 0 || account.apiKeySecret.length === 0) {
            return;
        }
        let socket = new WebSocket(wsUrl, {
            retryCount: 2, // default is 2
            reconnectInterval: 1 // default is 5
        });
        console.warn('renewSocket', account.id, account.testnet, account.apiKeyID, account.apiKeySecret, wsUrl);

        socket.on('connect', () => {
            account.rest.getTimestamp((result) => {
                const expires = parseInt(result / 1000 + 5);
                const signature = service.signMessage(account.apiKeySecret, 'GET', '/realtime', expires);

                socket.send(JSON.stringify({
                    op: "authKeyExpires",
                    args: [account.apiKeyID, expires, signature],
                }));

                for (let subscribe of account.subscribes) {
                    socket.send(subscribe);
                }

                if (!!account.socket) {
                    account.socket.destroy();
                    // delete account.socket;
                }
                account.socket = socket;
            });
        });

        socket.on('message', (data) => {
            // const timestamp = new Date().getTime();
            account.lastTimestamp = new Date().getTime();
            data = JSON.parse(data);
            service.onWsMessage(data);
            // console.log(data);
            // console.log('message', account.id, JSON.stringify(data));
            if (!!data.request) {
                console.log('message', account.id, JSON.stringify(data));
                // if (!!data.request.op) {
                // }
            }
            if (!!data.table) {
                const table = data.table;
                if (table === 'order') {
                    service.onWsOrder(data.action, data.data, account);
                } else if (table === 'trade') {
                    service.onWsTrade(data.action, data.data);
                } else if (table === 'orderBookL2_25') {
                    service.onWsOrderBookL2_25(data.action, data.data, account);
                } else if (table === 'position') {
                    service.onWsPosition(data.action, data.data, account);
                } else if (table === 'wallet') {
                    service.onWsWallet(data.action, data.data, account);
                }
            }
        });

        socket.on('reconnect', (data) => {
            console.warn('reconnect', account.id, data);
            const timestamp = new Date().toISOString();
            let sql = sprintfJs.sprintf("INSERT INTO `bitmex_log`(`timestamp`, `email`, `testnet`, `apiKeyID`, `apiKeySecret`, `isParent`, `message`) VALUES ('', '', '', '', '', '', '') ON DUPLICATE KEY UPDATE `email` = VALUES(`email`), `testnet` = VALUES(`testnet`), `apiKeyID` = VALUES(`apiKeyID`), `apiKeySecret` = VALUES(`apiKeySecret`), `isParent` = VALUES(`isParent`), `message` = VALUES(`message`);", timestamp, account.email, account.testnet, account.apiKeyID, account.apiKeySecret, account.isParent, 'Websocket reconnecting');

            // dbConn.query(sql);
            // dbConn.query(sql, null, (error, results, fields) => {});
            // account.socket.start();
        });

        socket.on('destroyed', (data) => {
            console.warn('destroyed', account.id, data);
        });

        socket.start();
    },

    init: (configs) => {
        console.log('init', JSON.stringify(configs));
        for (let account of service.accounts) {
            if (account.renewSocketTimeoutId) {
                clearTimeout(account.renewSocketTimeoutId);
            }
            delete account.rest;
            account.socket.destroy();
            delete account.socket;
        }
        service.accounts = [];
        let idx = 0;
        for (let item of configs) {
            let account = {
                id: item.id,
                rest: new BitMEXApi(Boolean(item.testnet), item.bitmexApikey, item.bitmexApikeySecret),
                socket: undefined,
                subscribes: [],
                email: Boolean(item.email),
                testnet: Boolean(item.bitmexTestnet),
                apiKeyID: item.bitmexApikey,
                apiKeySecret: item.bitmexApikeySecret,
                lastTimestamp: 0,
            };

            service.accounts.push(account);

            account.renewSocketTimeoutId = setTimeout(service.renewSocket, 500 * idx++, account);
        }
    },

    initFromDb: (tableName, onFullfiled, onRejected) => {
        // let sql = sprintfJs.sprintf("SELECT A.* FROM `%s` A where id = 1;", tableName);
        let sql = sprintfJs.sprintf("SELECT A.* FROM `%s` A;", tableName);
        dbConn.query(sql, null, (error, results, fields) => {
            if (error) {
                console.error('initFromDb', error);
                if (typeof onRejected === 'function') {
                    onRejected(error);
                }
            } else {
                service.init(results);
                if (typeof onFullfiled === 'function') {
                    onFullfiled(results);
                }
            }
        });

    },

    restPosition: (method, data, onFulfilled, onRejected) => {
        for (let account of service.accounts) {
            account.rest.position(method, data, (data) => {
                if (typeof onFulfilled === 'function') {
                    onFulfilled({
                        id: account.id,
                        data: data,
                    });
                }
            }, (error) => {
                if (typeof onRejected === 'function') {
                    onRejected({
                        id: account.id,
                        data: error,
                    });
                }
            });
        }
    },

    wsSubscribe: (command, symbol) => {
        const query = JSON.stringify({
            op: 'subscribe',
            args: command + ':' + symbol,
        });
        for (let account of service.accounts) {
            if (!!account.socket && account.socket.isConnected) {
                account.socket.send(query);
            } else {
                account.subscribes.push(query);
            }
        }
    },

    wsTrade: (symbol) => {
        service.wsSubscribe('trade', symbol);
    },

    wsOrderBookL2_25: (symbol) => {
        service.wsSubscribe('orderBookL2_25', symbol);
    },

    wsExecution: (symbol) => {
        service.wsSubscribe('execution', symbol);
    },

    wsOrder: (symbol) => {
        service.wsSubscribe('order', symbol);
    },

    wsPosition: (symbol) => {
        service.wsSubscribe('position', symbol);
    },

    wsWallet: (symbol) => {
        service.wsSubscribe('wallet', symbol);
    },

    onWsMessage: (data) => {
        if (!!service.ioClient && service.ioClient.connected) {
            service.ioClient.emit('message', JSON.stringify(data));
        }
    },

    onWsOrder: (action, data, account) => {
        // console.log('onWsOrder', new Date(), account.id, action, JSON.stringify(data));
        if (action === 'partial') {
            service.orders.set(account.id, data);
        } else if (action === 'insert') {
            let orders = service.orders.get(account.id);
            for (let item of data) {
                let flag = true;
                for (let order of orders) {
                    if (item.orderID === order.orderID) {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    orders.push(item);
                }
            }
        } else if (action === 'update') {
            let orders = service.orders.get(account.id);
            let idx;
            const cnt = orders.length - 1;
            for (let item of data) {
                for (idx = cnt; idx >= 0; idx--) {
                    if (item.orderID === orders[idx].orderID) {
                        Object.entries(item).forEach(entry => {
                            let key = entry[0];
                            let value = entry[1];
                            orders[idx][key] = value;
                        });
                        break;
                    }
                }
            }
            service.orders.set(account.id, orders);
        }

        if (!!service.ioClient && service.ioClient.connected) {
            // console.log('emit-orders', service.orders);
            service.ioClient.emit('orders', map_to_json(service.orders));
        }

        if (action === 'update') {
            let orders = service.orders.get(account.id);
            let idx;
            const cnt = orders.length - 1;
            for (let item of data) {
                for (idx = cnt - 1; idx >= 0; idx--) {
                    if (item.orderID === orders[idx].orderID) {
                        if (item.ordStatus === 'Filled' || item.ordStatus === 'Canceled') {
                            orders.splice(idx, 1);
                        }
                    }
                }
            }
            service.orders.set(account.id, orders);
        }

        if (!!service.ioClient && service.ioClient.connected) {
            service.ioClient.emit('orders', map_to_json(service.orders));
        }
    },

    onWsTrade: (action, data) => {
        if (!!service.ioClient && service.ioClient.connected) {
            service.ioClient.emit('trade', JSON.stringify(data));
        }
    },

    onWsOrderBookL2_25: (action, data, account) => {
        // console.log('onWsOrderBookL2_25', account.id, action, JSON.stringify(data));
    },

    onWsPosition: (action, data, account) => {
        // console.log('onWsPosition', new Date(), account.id, action, JSON.stringify(data));

        if (action === 'partial') {
            for (let item of data) {
                if (typeof service.positions.get(item.account) === 'undefined') {
                    let map = new Map();
                    map.set('accountId', account.id);
                    map.set('testnet', account.testnet);
                    map.set('apiKeyID', account.apiKeyID);
                    map.set('apiKeySecret', account.apiKeySecret);
                    service.positions.set(item.account, map);
                }
                let position = service.positions.get(item.account);
                position.set(item.symbol, item);
            }
            // service.positions
        } else if (action === 'insert') {

        } else if (action === 'update') {
            const rest = account.rest;

            for (let item of data) {
                if (typeof service.positions.get(item.account) === 'undefined') {
                    service.positions.set(item.account, new Map());
                }
                let position = service.positions.get(item.account).get(item.symbol);
                if (typeof position === 'undefined') {
                    position = {};
                }
                Object.entries(item).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];
                    position[key] = value;
                    //use key and value here
                });

                service.positions.get(item.account).set(item.symbol, position);
            }
        }

        if (!!service.ioClient && service.ioClient.connected) {
            // console.log('service.positions', map_to_object(service.positions));
            service.ioClient.emit('positions', map_to_json(service.positions));
        }
    },

    onWsWallet: (action, data, account) => {
        // console.error('onWsWallet', account.id, action, JSON.stringify(data));
        if (action === 'partial') {
            if (data.length > 0) {
                let item = data[0];
                item['accountId'] = account.id;
                item['testnet'] = account.testnet;
                item['apiKeyID'] = account.apiKeyID;
                item['apiKeySecret'] = account.apiKeySecret;
                service.wallets.set(item.account, item);
            }
        } else if (action === 'insert') {
            if (data.length > 0) {
                let item = data[0];
                item['accountId'] = account.id;
                item['testnet'] = account.testnet;
                item['apiKeyID'] = account.apiKeyID;
                item['apiKeySecret'] = account.apiKeySecret;
                service.wallets.set(item.account, item);
            }
        } else if (action === 'update') {
            if (data.length > 0) {
                let item = data[0];
                let wallet = service.wallets.get(item.account);
                Object.entries(item).forEach(entry => {
                    let key = entry[0];
                    let value = entry[1];

                    wallet[key] = value;
                });
                service.wallets.set(item.account, wallet);
            }
        }
        // if (account.isParent && !!service.ioClient && service.ioClient.connected) {
        if (!!service.ioClient && service.ioClient.connected) {
            service.ioClient.emit('wallets', map_to_json(service.wallets));
        }
    },

    // onSIORestart: () => {
    //
    // }
};
module.exports = {BitMEXService: service, GET, POST, PUT, DELETE};
