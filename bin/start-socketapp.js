import debugLib from 'debug';
import cluster from 'cluster';
import config from '../core/config';
import {BitMEXService} from '../services/bitmexService';

if (cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', function (worker, code, signal) {
        cluster.fork();
    });
}

let debug;
if (cluster.isWorker) {
    debug = new debugLib('bitmex-profit:socket');

    BitMEXService.initSocketIOClient();

    BitMEXService.initFromDb(config.dbTblName.users, () => {
        BitMEXService.wsOrder('XBTUSD');
        BitMEXService.wsTrade('XBTUSD');
        BitMEXService.wsOrderBookL2_25('XBTUSD');
        BitMEXService.wsExecution('XBTUSD');
        BitMEXService.wsWallet('*');
        BitMEXService.wsPosition('XBTUSD');
        // BitMEXService.restPosition(GET, {}, (data) => {
        //     console.log('restPosition', JSON.stringify(data));
        // }, (error) => {
        //     console.warn('restPosition', JSON.stringify(error));
        // });
    });
}
