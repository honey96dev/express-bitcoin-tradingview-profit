let instance;

function ActiveOrders() {
}

ActiveOrders.prototype.init = function() {
    const self = this;
    self.uriRoot = $('#uriRoot').val();

    self.accountId = $('#accountId').val();

    self.table = $('#table').DataTable({
        responsive: true,
        bAutoWidth: false,
        data: [],
        columns: [
            {
                data: "side",
                orderable: false,
            },
            {
                data: "symbol",
            },
            {
                data: "orderQty",
                render: $.fn.dataTable.render.number(',', '.', 2, ''),
            },
            {
                data: "price",
                render: $.fn.dataTable.render.number(',', '.', 2, ''),
            },
            {
                data: "stopPx",
                render: $.fn.dataTable.render.number(',', '.', 2, ''),
            },
            {
                data: "filledQty",
                render: $.fn.dataTable.render.number(',', '.', 2, ''),
            },
            {
                data: "remainingQty",
                render: $.fn.dataTable.render.number(',', '.', 2, ''),
            },
            // {
            //     data: "orderValue",
            //     render: $.fn.dataTable.render.number(',', '.', 4, ''),
            // },
            // {
            //     data: "fillPrice",
            //     render: $.fn.dataTable.render.number(',', '.', 2, ''),
            // },
            {
                data: "ordType",
            },
            {
                data: "ordStatus",
            },
            {
                data: "time",
                // render: function (data, type, row, meta) {
                //     return meta.row + 1;
                // },
            },
        ],
        order: [],
        // language: {
        //     search: "",
        //     sLengthMenu: "_MENU_",
        // },
    });


    self.socket = io($('#baseUrl').val(), {
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 4000,
        reconnectionAttempts: Infinity
    });
    self.socket.on('message', (data) => {
        console.log(data);
    });
    self.socket.on('alive', (data) => {
        console.log('socket-io', 'alive', data);
    });
    self.socket.on('connect', () => {
        // console.log('socket-io', 'connect');
        if (!!self.accountId) {
            self.socket.emit('requestAccounts', JSON.stringify([self.accountId]));
            // self.socket.emit('positions??');
            self.socket.emit('orders??');

            // self.socket.emit('positions?');
            self.socket.emit('orders?');
        }
    });

    self.socket.on('orders', (data) => {
        let newData = [];
        Object.entries(data).forEach(entry => {
            let key = entry[0];
            let value = entry[1];
            newData = value;
        });

        let orders = [];
        let order;
        let ordType;
        let time;
        for (let item of newData) {
            if (item['ordStatus'] != 'New') {
                continue;
            }
            if (item['ordType'] == 'Stop') {
                ordType = 'Stop Loss';
            } else if (item['ordType'] == 'MarketIfTouched') {
                ordType = 'Take Profit';
            } else {
                ordType = item.ordType;
            }
            time = new Date(item.timestamp);
            time = sprintf("%02d/%02d/%04d %02d:%02d", time.getMonth() + 1, time.getDate(), time.getFullYear(), time.getHours(), time.getMinutes());
            order = {
                side: item.side,
                symbol: item.symbol,
                orderQty: item.orderQty,
                price: !!item.price ? item.price : 'Market',
                filledQty: !!item.leavesQty ? item.orderQty - item.leavesQty : 0,
                remainingQty: !!item.leavesQty ? item.leavesQty : item.orderQty,
                stopPx: !!item.stopPx ? item.stopPx : 0,
                triggeringPx: 0,
                orderValue: 0,
                fillPrice: 0,
                ordType: ordType,
                ordStatus: item.ordStatus,
                time: time,
                orderID: item.orderID,
            };
            orders.push(order);
        }
        console.log('orders', orders);

        self.table.clear();
        self.table.rows.add(orders);
        self.table.draw();
    });

    $('#accountId').on('change', function () {
        self.accountId = $(this).val();
        if (!!self.accountId) {
            self.socket.emit('requestAccounts', JSON.stringify([self.accountId]));
            self.socket.emit('orders??');
            self.socket.emit('orders?');
        }
    });
};

$(document).ready(function () {
    instance = new ActiveOrders();
    instance.init();
});
