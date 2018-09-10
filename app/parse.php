<?php
/**
 * Created by ielovskiy
 */
if (!isset($_SESSION)) {
	session_start();
}

if (isset($_SESSION) && $_SESSION['name'] && $_POST["type"] === 'parse') {

	ini_set('error_reporting', E_ALL);
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	set_time_limit(86400);
	ini_set('memory_limit', '3000M');
	ignore_user_abort(true);
	date_default_timezone_set('America/New_York');

	require_once 'writer.php';

	$timezone = $_POST["timezone"];
	$prefix = $_POST["prefix"];
	$delimiter = trim($_POST["delimiter"]);
	$file = $_FILES["file-0"];

	if (empty($prefix) || empty($timezone) || empty($delimiter) || !$file) {
		Writer::inProcessLog('Error: All fields are required', $prefix);
		echo json_encode(array('error' => 'Error: All fields are required'));
		exit;
	}

	$parse = new Parse();
	$parse->prefix = $prefix;
	$parse->delimiter = $delimiter;
	$data = $parse->parseCSV($file['tmp_name']);

	if ($data['deposit'] === null) {
		echo json_encode(array('error' => 'Error: Deposit not found'));
		exit;
	}

	echo json_encode(array(
		'message' => 'Total trades: ' . count($data['trades']) . ', deposit: ' . $data['deposit'],
		'trades'  => $data['trades'],
		'deposit' => $data['deposit']
	));
}

class Parse {

	public $delimiter = ';';
	public $prefix;

	public function parseCSV($file) {

		$arr = file($file);
		$count_rows = count($arr);
		$temp = explode($this->delimiter, array_pop($arr));

		$deposit = null;
		for ($i = 0; $i < count($temp); $i++) {
			if (is_numeric($temp[$i]) && $temp[$i] > 0) {
				$deposit = $temp[$i];
				break;
			}
		}

		$fr = fopen($file, 'r');
		if ($fr === false) {
			die ('File open error');
		}
		Writer::inProcessLog('Start parse file', $this->prefix);

		$column_headers = explode($this->delimiter, fgets($fr));
		Writer::inProcessLog('Headers: ' . trim(implode(', ', $column_headers)), $this->prefix);

		$n = 1;
		$trades = array();
		while (($cols = fgetcsv($fr, null, $this->delimiter, '"')) !== false) {
			if ($n === $count_rows) {
				break;
			}
			$values = array();
			for ($i = 0; $i < count($cols); $i++) {
				switch ($i) {
					case 0:
						$values['open_date'] = $cols[$i];
						break;
					case 1:
						$values['close_date'] = $cols[$i];
						break;
					case 2:
						if (stristr($cols[$i], '/') === false) {
							$one = substr($cols[$i], 0, 3);
							$two = substr($cols[$i], 3);
							$instrument = $one . '/'. $two;
						} else {
							$instrument = $cols[$i];
						}
						$values['instrument'] = $instrument;
						break;
					case 3:
						$values['action'] = $cols[$i];
						break;
					case 4:
						$values['lots_count'] = $cols[$i];
						break;
					case 7:
						$values['open_price'] = $cols[$i];
						break;
					default:
						break;
				}
			}
			$trades[] = $values;
			$n = $n + 1;
		}

		fclose($fr);

		array_pop($trades);

		Writer::inProcessLog('Parse file finish, total trades: ' . count($trades) . ', deposit: ' . $deposit, $this->prefix);

		return array('trades' => $trades, 'deposit' => $deposit);

	}


}