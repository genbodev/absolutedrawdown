<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/jquery.formstyler.css">
    <link rel="stylesheet" href="css/jquery.formstyler.theme.css">
    <link rel="icon" type="image/png" href="favicon-32x32.png" sizes="32x32" />
    <title>Absolute Draw Down</title>
</head>
<body>
<div class="body-div">
    <div class="title">
        <h2>Absolute Draw Down</h2>
    </div>
    <form id="login-form" method="post" enctype="multipart/form-data" action="app/actions.php">
        <div class="field">
            <div>
                <label for="login">Login:</label>
            </div>
            <input type="text" name="login" id="login" value="" class="styler"/>
        </div>
        <div class="field">
            <div>
                <label for="password">Password:</label>
            </div>
            <input type="password" name="password" id="password" value="" class="styler"/>
        </div>
        <div class="field">
            <button type="submit" name="submit" id="submit" class="styler">Login</button>
            <p class="message" id="message">Error: All fields are required</p>
        </div>
    </form>
</div>
</body>
<script src="js/jquery-3.3.1.min.js" type="text/javascript"></script>
<script src="js/jquery.formstyler.min.js" type="text/javascript"></script>
<script src="js/login.js" type="text/javascript"></script>
</html>

