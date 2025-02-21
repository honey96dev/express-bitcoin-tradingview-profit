let instance;

function Dashboard() {
    const self = this;
    self.uriRoot = $('#uriRoot').val();
    // self.table = $('#newUsersTable').DataTable({
    //     responsive: true,
    //     bAutoWidth: false,
    //     ajax: self.uriRoot + 'users/list?getToday=1',
    //     columns: [
    //         {
    //             width: '30',
    //             data: null,
    //             className: 'text-right',
    //             render: function (data, type, row, meta) {
    //                 return meta.row + 1;
    //             },
    //         },
    //         {
    //             data: "email",
    //             className: "text-center",
    //         },
    //         {
    //             data: "username",
    //             className: "text-center",
    //         },
    //     ],
    //     language: {
    //         search: "",
    //         sLengthMenu: "_MENU_",
    //     },
    // });
    $.ajax({
        method: 'GET',
        url: self.uriRoot + 'users/list?getToday=1',
        dataType: 'json',
        success: function (res) {
            if (res.result == 'success') {
                $('#newUsers').html(res.data.length);
            } else {
                $('#newUsers').html('N/A');
            }
        },
        error: function () {
            $('#newUsers').html('N/A');
        }
    });
    $.ajax({
        method: 'GET',
        url: self.uriRoot + 'dashboard/active-bots',
        dataType: 'json',
        success: function (res) {
            if (res.result == 'success') {
                $('#activeBots').html(res.data.length);
            } else {
                $('#activeBots').html('N/A');
            }
        },
        error: function () {
            $('#activeBots').html('N/A');
        }
    });
    $.ajax({
        method: 'GET',
        url: self.uriRoot + 'dashboard/daily-profit',
        dataType: 'json',
        success: function (res) {
            if (res.result == 'success') {
                $('#dailyProfit').html(res.data);
            } else {
                $('#dailyProfit').html('N/A');
            }
        },
        error: function () {
            $('#dailyProfit').html('N/A');
        }
    });
    $.ajax({
        method: 'GET',
        url: self.uriRoot + 'dashboard/daily-trades',
        dataType: 'json',
        success: function (res) {
            $('#dailyTrades').html(res.data.length);
        },
        error: function () {
            $('#dailyTrades').html('N/A');
        }
    });
    self.table = $('#usersTable').DataTable({
        responsive: true,
        bAutoWidth: false,
        ajax: self.uriRoot + 'users/list',
        columns: [
            {
                width: '30',
                data: null,
                className: 'text-right',
                render: function (data, type, row, meta) {
                    return meta.row + 1;
                },
            },
            {
                data: "email",
                className: "text-center",
            },
            {
                data: "username",
                className: "text-center",
            },
        ],
        // language: {
        //     search: "",
        //     sLengthMenu: "_MENU_",
        // },
    });
};

Dashboard.prototype.init = function() {

};

$(document).ready(function () {
    instance = new Dashboard();
    instance.init();
});
