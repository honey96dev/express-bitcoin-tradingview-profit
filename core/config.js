module.exports = {
    server: {
        isDev: false,
        // port: 3030,
        port: 3000,
        portSsl: 443,
        userBaseUrl: 'http://127.0.0.1:3000/',
        adminBaseUrl: 'http://127.0.0.1:3000/admin/',
        name: 'Bitmex-Profit',
        description: 'BitMEX Profit',
        author: 'Zhenlong J.',
        secret: 'bitmexprofit@@',
        sslKey: './sslcert/localhost.key',
        sslCert: './sslcert/localhost.cert',
        sslCA: './sslcert/alphasslrootcabundle.crt',
    },
    mysql: {
        connectionLimit: 10,
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'bitmex_profit',
        port: 3306
    },
    session: {
        name: 'ProwebMedia2',
        key: 'bitmexprofit',
        secret: 'bitmexprofittoken@@',
    },
    smtp: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: '',
        pass: '',
    },
    dbTblName: {
        admins: 'admins',
        propietarios: 'users',
        documentos: 'documentos',
        tokens: 'tokens',
    },
};
