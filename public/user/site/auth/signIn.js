let instance;

function SignIn() {

}

SignIn.prototype.init = function() {
    $('#signIn').click(function (e) {
        e.preventDefault();
        var btn = $(this);
        var form = $('#signInForm');

        form.validate({
            rules: {
                email: {
                    required: true,
                    email: true,
                },
                password: {
                    required: true,
                },
            },
        });

        if (!form.valid()) {
            return;
        }

        btn.attr('disabled', true);

        form.ajaxSubmit({
            // url: '',
            method: 'POST',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    window.location.href = $('#baseUrl').val();
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

SignIn.prototype.showErrorMsg = function (form, type, msg) {
    let alert = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><span class="alert-message"></span></div>');

    form.find('.alert').remove();
    alert.prependTo(form);
    alert.find('span.alert-message').html(msg);
};

$(document).ready(function () {
    instance = new SignIn();
    instance.init();
});
