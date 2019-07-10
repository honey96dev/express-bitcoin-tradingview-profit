let instance;

function Settings() {

};

Settings.prototype.init = function() {
    const self = this;
    //modify buttons style
    $.fn.editableform.buttons =
        '<button type="submit" class="btn btn-success editable-submit btn-sm waves-effect waves-light"><i class="mdi mdi-check"></i></button>' +
        '<button type="button" class="btn btn-danger editable-cancel btn-sm waves-effect waves-light"><i class="mdi mdi-close"></i></button>';
    //inline


    $('#walletPercent').editable({
        // validate: function (value) {
        //     value = $.trim(value);
        //     if (value == '') return 'This field is required';
        //     if (!self.isValidEmail(value)) return 'Invalid email';
        // },
        type: 'number',
        pk: 1,
        name: 'walletPercent',
        title: '% of wallet amount to use',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#profitPerTrade').editable({
        type: 'number',
        pk: 2,
        name: 'profitPerTrade',
        title: '% of profit per trade',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#percentStopLoss').editable({
        type: 'text',
        pk: 3,
        name: 'percentStopLoss',
        title: '% of stop loss',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#percentTakeProfit').editable({
        type: 'text',
        pk: 4,
        name: 'percentTakeProfit',
        title: '% of take profit',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#saveProperty').click(function (e) {
        let btn = $(this);
        let section = $('#propertiesSec');

        let email = $('#email').html();
        let bitmexApikey = $('#bitmexApikey').html();
        let bitmexApikeySecret = $('#bitmexApikeySecret').html();
        let bitmexTestnet = $('#bitmexTestnet').html();
        bitmexApikey = bitmexApikey == 'Empty' ? '' : bitmexApikey;
        bitmexApikeySecret = bitmexApikeySecret == 'Empty' ? '' : bitmexApikeySecret;
        bitmexTestnet = bitmexTestnet == 'Testnet' ? 1 : 0;
        console.log(email, bitmexApikey, bitmexApikeySecret, bitmexTestnet);

        btn.attr('disabled', true);

        $.ajax({
            url: '/settings/properties',
            method: 'POST',
            data: {
                email,
                bitmexApikey,
                bitmexApikeySecret,
                bitmexTestnet,
            },
            dataType: 'json',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    $('#email,#bitmexApikey,#bitmexApikeySecret,#bitmexTestnet').removeClass('editable-unsaved');
                    instance.showErrorMsg(section, 'success', message);
                } else if (result === 'error') {
                    instance.showErrorMsg(section, 'danger', message);
                }
            },
            error: function (error) {
                instance.showErrorMsg(section, 'danger', 'Unknown server error');
                btn.attr('disabled', false);
            },
        })

    });
};

Settings.prototype.showErrorMsg = function (section, type, msg) {
    let alert = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><span class="alert-message"></span></div>');

    section.find('.alert').remove();
    alert.prependTo(section);
    alert.find('span.alert-message').html(msg);
};

$(document).ready(function () {
    instance = new Settings();
    instance.init();
});
