let instance;

function Users() {

}

Users.prototype.init = function () {
    const self = this;
    self.uriRoot = $('#uriRoot').val();
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
            {
                data: "signedUpDate",
                className: "text-center",
            },
            {
                data: "activeTrading",
                className: "text-center",
                render: function (data, type, row) {
                    return data == 1 ? 'Yes' : 'No';
                },
            },
            {
                data: "totalProfit",
                className: "text-right",
                render: $.fn.dataTable.render.number(',', '.', 4, ''),
            },
            {
                width: '30',
                data: null,
                render: function (data, type, row, meta) {
                    return '<button class="btn btn-outline-info btn-sm waves-effect waves-light" onclick="instance.editUser(' + meta.row + ')"><i class="fa fa-edit"></i>';
                },
                orderable: false,
            },
            {
                width: '30',
                data: "id",
                render: function (data, type, row) {
                    return '<button class="btn btn-outline-danger btn-sm waves-effect waves-light" onclick="instance.deleteUser(' + data + ', \'' + row.email + '\', \'' + row.username + '\')"><i class="fa fa-trash"></i></button>';
                },
                orderable: false,
            },
        ]
    });

    $('#editUserButton').click(function (e) {
        const btn = $(this);
        const form = $('#editUserForm');

        form.parsley().validate();
        if (!form.parsley().isValid()) {
            return;
        }

        btn.attr('disabled', true);
        form.ajaxSubmit({
            method: 'PUT',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    instance.showErrorMsg(form, 'success', message);
                    $.ajax({
                        method: 'GET',
                        url: self.uriRoot + 'users/list',
                        dataType: 'json',
                        success: function (data) {
                            self.table.clear();
                            self.table.rows.add(data.data);
                            self.table.draw();
                        },
                    })
                } else if (result === 'error') {
                    instance.showErrorMsg(form, 'danger', message);
                }

            },
            error: function (error) {
                btn.attr('disabled', false);
                instance.showErrorMsg(form, 'danger', 'Unknown server error');
            },
        });
    });

    $('#changePasswordButton').click(function (e) {
        const btn = $(this);
        const form = $('#changePasswordForm');

        form.parsley().validate();
        if (!form.parsley().isValid()) {
            return;
        }

        btn.attr('disabled', true);
        form.ajaxSubmit({
            method: 'POST',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                if (result === 'success') {
                    instance.showErrorMsg(form, 'success', message);
                    // $('#oldPassword').val('');
                    $('#password').val('');
                    $('#password2').val('');
                    $.ajax({
                        method: 'GET',
                        url: self.uriRoot + 'users/list',
                        dataType: 'json',
                        success: function (data) {
                            self.table.clear();
                            self.table.rows.add(data.data);
                            self.table.draw();
                        },
                    })
                } else if (result === 'error') {
                    instance.showErrorMsg(form, 'danger', message);
                }

            },
            error: function (error) {
                btn.attr('disabled', false);
                instance.showErrorMsg(form, 'danger', 'Unknown server error');
            },
        });
    });

    $('#deleteUserButton').click(function (e) {
        const btn = $(this);
        const form = $('#deleteUserForm');
        btn.attr('disabled', true);
        form.ajaxSubmit({
            method: 'DELETE',
            success: function (response, status, xhr, $form) {
                const result = response.result;
                const message = response.message;
                btn.attr('disabled', false);
                $('#deleteUserModal').modal('hide');
                if (result === 'success') {
                    $('#alertTitle').html('Success');
                    $('#alertMessage').html(message);
                    $.ajax({
                        method: 'GET',
                        url: self.uriRoot + 'users/list',
                        dataType: 'json',
                        success: function (data) {
                            self.table.clear();
                            self.table.rows.add(data.data);
                            self.table.draw();
                        },
                    })
                } else if (result === 'error') {
                    $('#alertTitle').html('Error');
                    $('#alertMessage').html(message);
                }

                $('#alertModal').modal('show');
            },
            error: function (error) {
                btn.attr('disabled', false);

                $('#deleteUserModal').modal('hide');
                $('#alertTitle').html('Error');
                $('#alertMessage').html('Unknown server error');
                $('#alertModal').modal('show');
            },
        });
    });
};

Users.prototype.editUser = function (row) {
    const self = this;
    let data = self.table.row(row).data();
    // console.log(data);
    $('#editUserId').val(data.id);
    $('#editUserUsername').val(data.username);
    $('#editUserEmail').val(data.email);
    $('#activeTrading').val(data.activeTrading);
    // $('#activeTrading1').attr('checked', data.activeTrading == 1);
    // $('#activeTrading2').attr('checked', data.activeTrading != 1);

    $('#changePasswordId').val(data.id);
    $('#oldPassword').val('');
    $('#password').val('');
    $('#password2').val('');

    $('#editUserForm').find('.alert').remove();
    $('#changePasswordForm').find('.alert').remove();

    $('#editUserModal').modal('show');
};

Users.prototype.deleteUser = function (id, email, username) {
    $('#deleteUserId').val(id);
    $('#deleteUserEmail').html('Email: <b>' + email + '</b>');
    $('#deleteUserUsername').html('Username: <b>' + username + '</b>');
    $('#deleteUserModal').modal('show');
};

Users.prototype.showErrorMsg = function (section, type, msg) {
    let alert = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button><span class="alert-message"></span></div>');

    section.find('.alert').remove();
    alert.prependTo(section);
    alert.find('span.alert-message').html(msg);
};

$(document).ready(function () {
    instance = new Users();
    instance.init();
});
