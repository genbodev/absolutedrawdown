<?php

ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
set_time_limit(86400);
ini_set('memory_limit', '3000M');
ignore_user_abort(true);
date_default_timezone_set('America/New_York');

if (!isset($_SESSION)) {
	session_start();
}

if (isset($_SESSION) && !$_SESSION['name']) {
	die("No access");
}

?>

<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/jquery.formstyler.css">
    <link rel="stylesheet" href="../css/jquery.formstyler.theme.css">
    <link rel="icon" type="image/png" href="../favicon-32x32.png" sizes="32x32" />
    <title>Absolute Draw Down</title>
</head>
<body>
<div class="body-div">
    <div class="title">
        <h2>Absolute Draw Down</h2>
        <form method="post" enctype="multipart/form-data" action="actions.php">
            <button type="submit" name="logout" id="logout" class="styler">Logout</button>
        </form>
    </div>
    <form id="ajax-form" method="post" enctype="multipart/form-data" action="actions.php">
        <div class="field">
            <div>
                <label for="timezone">Time zone:</label>
            </div>
            <select name="timezone" id="timezone">
                <option value="Pacific/Midway">Midway Island</option>
                <option value="Pacific/Samoa">Samoa</option>
                <option value="Pacific/Honolulu">Hawaii</option>
                <option value="US/Alaska">Alaska</option>
                <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                <option value="America/Tijuana">Tijuana</option>
                <option value="US/Arizona">Arizona</option>
                <option value="America/Chihuahua">Chihuahua</option>
                <option value="America/Chihuahua">La Paz</option>
                <option value="America/Mazatlan">Mazatlan</option>
                <option value="US/Mountain">Mountain Time (US &amp; Canada)</option>
                <option value="America/Managua">Central America</option>
                <option value="US/Central">Central Time (US &amp; Canada)</option>
                <option value="America/Mexico_City">Guadalajara</option>
                <option value="America/Mexico_City">Mexico City</option>
                <option value="America/Monterrey">Monterrey</option>
                <option value="Canada/Saskatchewan">Saskatchewan</option>
                <option value="America/Bogota">Bogota</option>
                <option value="US/Eastern">Eastern Time (US &amp; Canada)</option>
                <option value="US/East-Indiana">Indiana (East)</option>
                <option value="America/Lima">Lima</option>
                <option value="America/Bogota">Quito</option>
                <option value="Canada/Atlantic">Atlantic Time (Canada)</option>
                <option value="America/Caracas">Caracas</option>
                <option value="America/La_Paz">La Paz</option>
                <option value="America/Santiago">Santiago</option>
                <option value="Canada/Newfoundland">Newfoundland</option>
                <option value="America/Sao_Paulo">Brasilia</option>
                <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                <option value="America/Argentina/Buenos_Aires">Georgetown</option>
                <option value="America/Godthab">Greenland</option>
                <option value="America/Noronha">Mid-Atlantic</option>
                <option value="Atlantic/Azores">Azores</option>
                <option value="Atlantic/Cape_Verde">Cape Verde Is.</option>
                <option value="Africa/Casablanca">Casablanca</option>
                <option value="Europe/London">Edinburgh</option>
                <option value="Etc/Greenwich">Greenwich Mean Time : Dublin</option>
                <option value="Europe/Lisbon">Lisbon</option>
                <option value="Europe/London">London</option>
                <option value="Africa/Monrovia">Monrovia</option>
                <option value="UTC">UTC</option>
                <option value="Europe/Amsterdam">Amsterdam</option>
                <option value="Europe/Belgrade">Belgrade</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Europe/Berlin">Bern</option>
                <option value="Europe/Bratislava">Bratislava</option>
                <option value="Europe/Brussels">Brussels</option>
                <option value="Europe/Budapest">Budapest</option>
                <option value="Europe/Copenhagen">Copenhagen</option>
                <option value="Europe/Ljubljana">Ljubljana</option>
                <option value="Europe/Madrid">Madrid</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Europe/Prague">Prague</option>
                <option value="Europe/Rome">Rome</option>
                <option value="Europe/Sarajevo">Sarajevo</option>
                <option value="Europe/Skopje">Skopje</option>
                <option value="Europe/Stockholm">Stockholm</option>
                <option value="Europe/Vienna">Vienna</option>
                <option value="Europe/Warsaw">Warsaw</option>
                <option value="Africa/Lagos">West Central Africa</option>
                <option value="Europe/Zagreb">Zagreb</option>
                <option value="Europe/Athens">Athens</option>
                <option value="Europe/Bucharest">Bucharest</option>
                <option value="Africa/Cairo">Cairo</option>
                <option value="Africa/Harare">Harare</option>
                <option value="Europe/Helsinki">Helsinki</option>
                <option value="Europe/Istanbul">Istanbul</option>
                <option value="Asia/Jerusalem">Jerusalem</option>
                <option value="Europe/Helsinki">Kyiv</option>
                <option value="Africa/Johannesburg">Pretoria</option>
                <option value="Europe/Riga">Riga</option>
                <option value="Europe/Sofia">Sofia</option>
                <option value="Europe/Tallinn">Tallinn</option>
                <option value="Europe/Vilnius">Vilnius</option>
                <option value="Asia/Baghdad">Baghdad</option>
                <option value="Asia/Kuwait">Kuwait</option>
                <option value="Europe/Minsk">Minsk</option>
                <option value="Africa/Nairobi">Nairobi</option>
                <option value="Asia/Riyadh">Riyadh</option>
                <option value="Europe/Volgograd">Volgograd</option>
                <option value="Asia/Tehran">Tehran</option>
                <option value="Asia/Muscat">Abu Dhabi</option>
                <option value="Asia/Baku">Baku</option>
                <option value="Europe/Moscow">Moscow</option>
                <option value="Asia/Muscat">Muscat</option>
                <option value="Europe/Moscow">St. Petersburg</option>
                <option value="Asia/Tbilisi">Tbilisi</option>
                <option value="Asia/Yerevan">Yerevan</option>
                <option value="Asia/Kabul">Kabul</option>
                <option value="Asia/Karachi">Islamabad</option>
                <option value="Asia/Karachi">Karachi</option>
                <option value="Asia/Tashkent">Tashkent</option>
                <option value="Asia/Calcutta">Chennai</option>
                <option value="Asia/Kolkata">Kolkata</option>
                <option value="Asia/Calcutta">Mumbai</option>
                <option value="Asia/Calcutta">New Delhi</option>
                <option value="Asia/Calcutta">Sri Jayawardenepura</option>
                <option value="Asia/Katmandu">Kathmandu</option>
                <option value="Asia/Almaty">Almaty</option>
                <option value="Asia/Dhaka">Astana</option>
                <option value="Asia/Dhaka">Dhaka</option>
                <option value="Asia/Yekaterinburg">Ekaterinburg</option>
                <option value="Asia/Rangoon">Rangoon</option>
                <option value="Asia/Bangkok">Bangkok</option>
                <option value="Asia/Bangkok">Hanoi</option>
                <option value="Asia/Jakarta">Jakarta</option>
                <option value="Asia/Novosibirsk">Novosibirsk</option>
                <option value="Asia/Hong_Kong">Beijing</option>
                <option value="Asia/Chongqing">Chongqing</option>
                <option value="Asia/Hong_Kong">Hong Kong</option>
                <option value="Asia/Krasnoyarsk">Krasnoyarsk</option>
                <option value="Asia/Kuala_Lumpur">Kuala Lumpur</option>
                <option value="Australia/Perth">Perth</option>
                <option value="Asia/Singapore">Singapore</option>
                <option value="Asia/Taipei">Taipei</option>
                <option value="Asia/Ulan_Bator">Ulaan Bataar</option>
                <option value="Asia/Urumqi">Urumqi</option>
                <option value="Asia/Irkutsk">Irkutsk</option>
                <option value="Asia/Tokyo">Osaka</option>
                <option value="Asia/Tokyo">Sapporo</option>
                <option value="Asia/Seoul">Seoul</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Adelaide">Adelaide</option>
                <option value="Australia/Darwin">Darwin</option>
                <option value="Australia/Brisbane">Brisbane</option>
                <option value="Australia/Canberra">Canberra</option>
                <option value="Pacific/Guam">Guam</option>
                <option value="Australia/Hobart">Hobart</option>
                <option value="Australia/Melbourne">Melbourne</option>
                <option value="Pacific/Port_Moresby">Port Moresby</option>
                <option value="Australia/Sydney">Sydney</option>
                <option value="Asia/Yakutsk">Yakutsk</option>
                <option value="Asia/Vladivostok">Vladivostok</option>
                <option value="Pacific/Auckland">Auckland</option>
                <option value="Pacific/Fiji">Fiji</option>
                <option value="Pacific/Kwajalein">International Date Line West</option>
                <option value="Asia/Kamchatka">Kamchatka</option>
                <option value="Asia/Magadan">Magadan</option>
                <option value="Pacific/Fiji">Marshall Is.</option>
                <option value="Asia/Magadan">New Caledonia</option>
                <option value="Asia/Magadan">Solomon Is.</option>
                <option value="Pacific/Auckland">Wellington</option>
                <option value="Pacific/Tongatapu">Nuku'alofa</option>
            </select>
        </div>
        <div class="field">
            <div>
                <label for="delimiter">Delimiter:</label>
            </div>
            <input type="text" name="delimiter" id="delimiter" value=";" class="styler"/>
        </div>
        <div class="field">
            <div>
                <label for="files">Source:</label>
            </div>
            <input type="file" name="files[]" id="files" accept=".csv" multiple/>
        </div>
        <div class="field" id="server-field">
            <div>
                <label for="server">Server:</label>
            </div>
            <input type="text" name="server" id="server" value="" class="styler"/>
        </div>
        <div class="field" id="login-field">
            <div>
                <label for="login">Login:</label>
            </div>
            <input type="text" name="login" id="login" value="" class="styler"/>
        </div>
        <div class="field" id="password-field">
            <div>
                <label for="password">Password:</label>
            </div>
            <input type="password" name="password" id="password" value="" class="styler"/>
        </div>
        <div class="field">
            <button type="submit" name="submit" id="submit" class="styler">Calculate</button>
            <p class="message" id="message">Error: All fields are required</p>
        </div>
    </form>

    <div class="log-title-wrapper">
        <div class="log-title" id="log-title"><a id="log-title-link" href="" download>Process</a></div>
        <div class="log-time" id="log-time"><span id="min">00</span>:<span id="sec">00</span></div>
    </div>
    <div class="log" id="log"></div>
</div>
</body>
<script src="../js/jquery-3.3.1.min.js" type="text/javascript"></script>
<script src="../js/jquery.formstyler.min.js" type="text/javascript"></script>
<script src="../js/transport.js" type="text/javascript"></script>
<script src="../js/moment-with-locales.js" type="text/javascript"></script>
<script src="../js/moment-timezone-with-data.js" type="text/javascript"></script>
<script src="../js/script.js" type="text/javascript"></script>
</html>
