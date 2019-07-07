let instance;

function SignUp() {

}

SignUp.prototype.init = function () {
    $('#signUp').click(function (e) {
        e.preventDefault();
        let btn = $(this);
        let form = $('#signUpForm');

        form.validate({
            rules: {
                email: {
                    required: true,
                    email: true,
                },
                username: {
                    required: true,
                },
                password: {
                    required: true,
                    minlength: 6,
                },
                agreeTerm: {
                    required: true,
                },
            },
            messages: {
                agreeTerm: {
                    required: 'Please accept our term and conditions',
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
                    instance.showErrorMsg(form, 'success', message);
                    // window.location.href = $('#baseUrl').val();
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

SignUp.prototype.showErrorMsg = function (form, type, msg) {
    let alert = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><span class="alert-message"></span></div>');

    form.find('.alert').remove();
    alert.prependTo(form);
    alert.find('span.alert-message').html(msg);
};

$(document).ready(function () {
    instance = new SignUp();
    instance.init();
});
