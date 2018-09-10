<?php
/**
 * Created by ielovskiy
 */

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

if ($_SERVER["REQUEST_METHOD"] === "POST") {

	require_once 'writer.php';

	if ($_POST["type"] === 'login') {
		$login = $_POST['login'];
		$password = md5($_POST['password']);

		if ($login === 'admin' && $password === '21232f297a57a5a743894a0e4a801fc3') {
			if (!isset($_SESSION)) {
				session_start();
			}
			$_SESSION['name'] = $login;
			echo json_encode(array('message' => 'Login success!'));
		} else {
			echo json_encode(array('error' => 'Error: Wrong login or password'));
		}

	} else if ($_POST["type"] === 'total' && $_SESSION['name']) {
		$prefix = $_POST["prefix"];
		$file_name = $_POST["file_name"];
		$account_currency = $_POST["account_currency"];
		$absolute_draw_down = $_POST["absolute_draw_down"];
		$min_points = $_POST["min_points"];
		$percent_of_draw_down = $_POST["percent_of_draw_down"];
		$time = $_POST["time"];

		if (empty($prefix) || empty($file_name) || empty($account_currency) || empty($absolute_draw_down) || empty($min_points) || empty($percent_of_draw_down) || empty($time)) {
			Writer::inProcessLog('Error: No data. Nothing to write', $prefix);
			echo json_encode(array('error' => 'Error: Nothing to write'));
			exit;
		} else {
			Writer::inProcessLog("All operation completed in " . $time . " seconds, absolute draw down: " . $absolute_draw_down . ", min. points: " . $min_points . ", percent of draw down: " . $percent_of_draw_down . "\r\n", $prefix);
			$file_name = Writer::inFile("Completed in " . $time . " seconds\r\n", $file_name, null);
			echo json_encode(array('message' => 'Well done!', 'file_name' => $file_name));
		}


	} else {
		if (isset($_POST['logout'])) {
			Writer::inProcessLog("Logout!", $prefix);
			unset($_SESSION['name']);
			session_destroy();
			header("Location: ../index.php");
			exit();
		}
	}

} else {
	http_response_code(403);
	echo "There was a problem with your submission, please try again.";
}