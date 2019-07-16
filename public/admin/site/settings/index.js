let instance;

function Settings() {

};

Settings.prototype.init = function() {
    const self = this;
    self.uriRoot = $('#uriRoot').val();

    $.fn.editableform.buttons =
        '<button type="submit" class="btn btn-success editable-submit btn-sm waves-effect waves-light"><i class="mdi mdi-check"></i></button>' +
        '<button type="button" class="btn btn-danger editable-cancel btn-sm waves-effect waves-light"><i class="mdi mdi-close"></i></button>';
    //inline

    $('#strategy').editable({
        type: 'text',
        pk: 1,
        name: 'strategy',
        title: 'Input strategy to apply for bots',
        mode: 'inline',
        // inputclass: 'input-xxlarge',
    });

    $('#minWallet').editable({
        validate: function (value) {
            value = parseFloat($.trim(value));
            if (value < 0) return 'Please input a number greater than 0';
        },
        type: 'number',
        step: 'any',
        pk: 2,
        name: 'minWallet',
        title: 'Minimum quantity of wallet',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#percentWallet').editable({
        validate: function (value) {
            value = parseInt($.trim(value));
            if (value < 0 || value > 100) return 'Please input a number between 0~100';
        },
        type: 'number',
        step: 'any',
        pk: 3,
        name: 'percentWallet',
        title: '% of wallet amount to use',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#profitPerTrade').editable({
        validate: function (value) {
            value = parseInt($.trim(value));
            if (value < 0 || value > 100) return 'Please input a number between 0~100';
        },
        type: 'number',
        step: 'any',
        pk: 4,
        name: 'profitPerTrade',
        title: '% of profit per trade',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#percentStopLoss').editable({
        validate: function (value) {
            value = parseInt($.trim(value));
            if (value < 0 || value > 100) return 'Please input a number between 0~100';
        },
        type: 'number',
        step: 'any',
        pk: 5,
        name: 'percentStopLoss',
        title: '% of stop loss',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#percentTakeProfit').editable({
        validate: function (value) {
            value = parseInt($.trim(value));
            if (value < 0 || value > 100) return 'Please input a number between 0~100';
        },
        type: 'number',
        step: 'any',
        pk: 6,
        name: 'percentTakeProfit',
        title: '% of take profit',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#saveProperty').click(function (e) {
        let btn = $(this);
        let section = $('#propertiesSec');

        let strategy = $('#strategy').html();
        let minWallet = $('#minWallet').html();
        let percentWallet = $('#percentWallet').html();
        let profitPerTrade = $('#profitPerTrade').html();
        let percentStopLoss = $('#percentStopLoss').html();
        let percentTakeProfit = $('#percentTakeProfit').html();

        strategy = strategy == 'Empty' ? '' : strategy;
        minWallet = minWallet == 'Empty' ? 0 : minWallet;
        percentWallet = percentWallet == 'Empty' ? 0 : percentWallet;
        profitPerTrade = profitPerTrade == 'Empty' ? 0 : profitPerTrade;
        percentStopLoss = percentStopLoss == 'Empty' ? 0 : percentStopLoss;
        percentTakeProfit = percentTakeProfit == 'Empty' ? 0 : percentTakeProfit;
        // bitmexApikeySecret = bitmexApikeySecret == 'Empty' ? '' : bitmexApikeySecret;
        // bitmexTestnet = bitmexTestnet == 'Testnet' ? 1 : 0;
        // console.log(email, bitmexApikey, bitmexApikeySecret, bitmexTestnet);

        btn.attr('disabled', true);
        let data = {
            strategy: strategy,
            minWallet: minWallet,
            percentWallet: percentWallet,
            profitPerTrade: profitPerTrade,
            percentStopLoss: percentStopLoss,
            percentTakeProfit: percentTakeProfit,
        };
        $.ajax({
            url: self.uriRoot + 'settings/properties',
            method: 'POST',
            data: {
                data: JSON.stringify(data),
            },
            dataType: 'json',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    $('#propertiesSec a').removeClass('editable-unsaved');
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

    $('#restartBots').click(function () {
        let section = $('#restartBotsModalBody');
        section.find('.alert').remove();

        $('#restartBotsModal').modal('show');
    });

    $('#restartBotsButton').click(function () {
        let btn = $(this);
        let section = $('#restartBotsModalBody');
        btn.attr('disabled', true);
        $.ajax({
            url: self.uriRoot + 'settings/restart-bots',
            method: 'POST',
            dataType: 'json',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    instance.showErrorMsg(section, 'success', message);
                } else if (result === 'error') {
                    instance.showErrorMsg(section, 'danger', message);
                }
            },
            error: function (error) {
                instance.showErrorMsg(section, 'danger', 'Unknown server error');
                btn.attr('disabled', false);
            },
        });
    });


    $('#changePassword').click(function (e) {
        e.preventDefault();
        const btn = $(this);
        const form = $('#passwordSec');

        form.parsley().validate();
        if (!form.parsley().isValid()) {
            return;
        }
        // console.log('success');
        $('#passwordSec').ajaxSubmit({
            url: self.uriRoot + 'settings/password',
            method: 'POST',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    instance.showErrorMsg(form, 'success', message);
                } else if (result === 'error') {
                    instance.showErrorMsg(form, 'danger', message);
                }
            },
            error: function (error) {
                instance.showErrorMsg(form, 'danger', 'Unknown server error');
                btn.attr('disabled', false);
            },
        });
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
