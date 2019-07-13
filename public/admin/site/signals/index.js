let instance;

function Signals() {

}

Signals.prototype.init = function () {
    const self = this;
    self.uriRoot = $('#uriRoot').val();
    self.table = $('#table').DataTable({
        responsive: true,
        bAutoWidth: false,
        ajax: self.uriRoot + 'signals/list',
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
                data: "time",
                className: "text-right",
            },
            {
                data: "text",
                className: "text-left",
            },
        ]
    });
};

$(document).ready(function () {
    instance = new Signals();
    instance.init();
});
