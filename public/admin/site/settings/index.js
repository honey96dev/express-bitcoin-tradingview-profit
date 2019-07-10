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


    $('#email').editable({
        validate: function (value) {
            value = $.trim(value);
            if (value == '') return 'This field is required';
            if (!self.isValidEmail(value)) return 'Invalid email';
        },
        type: 'email',
        pk: 1,
        name: 'email',
        title: 'Enter email',
        mode: 'inline',
        inputclass: 'form-control-sm',
    });

    $('#bitmexApikey').editable({
        type: 'text',
        pk: 2,
        name: 'bitmexApikey',
        title: 'Enter BitMEX Apikey',
        mode: 'inline',
        inputclass: 'input-xxlarge',
    });

    $('#bitmexApikeySecret').editable({
        type: 'text',
        pk: 3,
        name: 'bitmexApikeySecret',
        title: 'Enter BitMEX Apikey Secret',
        mode: 'inline',
        inputclass: 'input-xxlarge',
    });

    $('#bitmexTestnet').editable({
        source: [
            {value: 1, text: 'Testnet'},
            {value: 0, text: 'Realnet'},
            // {value: 1, text: 'Testnet'},
            // {value: 0, text: 'Realnet'},
        ],
        pk: 4,
        name: 'bitmexTestnet',
        title: 'BitMEX Environment',
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

    // $('#passwordSec').parsley();

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
            url: '/settings/password',
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
    })
};

Settings.prototype.isValidEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/igm;
    if (email.length == 0 || !re.test(email)) {
        return false;
    } else {
        return true;
    }
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
