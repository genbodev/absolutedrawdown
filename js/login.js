/**
 * Created by ielovskiy
 */
$(document).ready(function () {
    $('.body-div').css('opacity', 1);
    var formElement = $('#login-form');
    var messageElement = $('#message');
    var loginElement = $('#login');
    var passwordElement = $('#password');
    var url = $(formElement).attr('action');
    $(formElement).submit(function () {
        event.preventDefault();
        if (validate() === true) {
            $(messageElement).hide();
            var formData = new FormData(this);
            formData.append('type', 'login');
            formData.append('login', $(loginElement).val());
            formData.append('password', $(passwordElement).val());
            var post = $.ajax({
                method: 'POST',
                url: url,
                data: formData,
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false
            });
            post.done(function (data, textStatus, jqXHR) {
                if (data.error) {
                    $(messageElement).text(data.error);
                    $(messageElement).show();
                } else {
                    document.location.href = "app/main.php";
                }
            });
            post.fail(function (jqXHR, textStatus, errorThrow) {
                console.log(jqXHR);
            });
        } else {
            $(messageElement).text('Error: All fields are required');
            $(messageElement).show();
        }
    });

    function validate() {
        var loginElement = $('#login');
        var passwordElement = $('#password');
        return $.trim($(loginElement).val()) !== '' && $.trim($(passwordElement).val()) !== '';
    }

});