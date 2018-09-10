<?php
/**
 * Created by ielovskiy
 */

if (!isset($_SESSION)) {
	session_start();
}

if (isset($_SESSION) && $_SESSION['name'] && $_POST["type"] === 'get_cache') {
	ini_set('error_reporting', E_ALL);
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	set_time_limit(86400);
	ini_set('memory_limit', '3000M');
	ignore_user_abort(true);
	date_default_timezone_set('America/New_York');

	require_once 'writer.php';

	$prefix = $_POST["prefix"];
	$instrument_id = $_POST["instrument_id"];
	$convert_instrument_id = $_POST["convert_instrument_id"];
	$from = $_POST["from"];
	$to = $_POST["to"];

	if (
		empty($prefix) ||
		empty($instrument_id) ||
		empty($convert_instrument_id) ||
		empty($from) ||
		empty($to)
	) {
		echo json_encode(array('error' => 'Error: No data. Will be skipped'));
		exit;
	}

	$instrument_id = json_decode($instrument_id);
	$convert_instrument_id = json_decode($convert_instrument_id);

	if (!file_exists('../cache')) {
		mkdir('../cache');
	}


	$cache = new Cache();
	$cache->prefix = $prefix;
	$quotes_cache_name = $cache->get($instrument_id, $from, $to);
	$convert_quotes_cache_name = null;
	if ($convert_instrument_id !== null) {
		$convert_quotes_cache_name = $cache->get($convert_instrument_id, $from, $to);
	}

	if ($quotes_cache_name && ($convert_instrument_id === null || $convert_quotes_cache_name)) {
		echo json_encode(array(
			'result' => array(
				'quotes_cache_name'         => $quotes_cache_name,
				'convert_quotes_cache_name' => $convert_quotes_cache_name
			)
		));
	} else {
		echo json_encode(array('result' => false));
	}
}

if (isset($_SESSION) && $_SESSION['name'] && $_POST["type"] === 'set_cache') {
	ini_set('error_reporting', E_ALL);
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	set_time_limit(86400);
	ini_set('memory_limit', '3000M');
	ignore_user_abort(true);
	date_default_timezone_set('America/New_York');

	$trade = $_POST["trade"];
	$prefix = $_POST["prefix"];

	if (empty($trade) || empty($prefix)) {
		echo json_encode(array('error' => 'Error: No data. Will be skipped'));
		exit;
	}

	$trade = json_decode($_POST["trade"]);

	$cache = new Cache();
	$cache->prefix = $prefix;
	$result = $cache->set($trade);

	echo json_encode(array('result' => $result));
}


class Cache {

	public $prefix;

	public function get($instrument_id, $from, $to) {
		$file_name = $instrument_id . '-' . $from . '-' . $to . '.csv.gz';
		$file_path = '../cache/' . $instrument_id . '-' . $from . '-' . $to . '.csv.gz';

		if (file_exists($file_path)) {
			return $file_name;
		} else {
			return false;
		}

	}

	public function set($trade) {
		$from = $trade->open_unix_time;
		$to = $trade->close_unix_time;
		$instrument_id = $trade->instrument_id;
		$quotes = $trade->quotes->ListQuotes;
		$quotes_cache_name = $this->setCSV($quotes, $instrument_id, $from, $to);
		$convert_quotes_cache_name = null;
		if (isset($trade->convert_quotes)) {
			$quotes = $trade->convert_quotes->ListQuotes;
			$convert_quotes_cache_name = $this->setCSV($quotes, $trade->convert_quotes->SymbolId, $from, $to);
		}

		return array(
			'quotes_cache_name'         => $quotes_cache_name,
			'convert_quotes_cache_name' => $convert_quotes_cache_name
		);
	}

	public function setCSV($quotes, $instrument_id, $from, $to) {
		$file_name = $this->prefix . '-' . $instrument_id . '-' . $from . '-' . $to . '.csv';
		$file_path = '../cache/' . $file_name;

		$archive_file = '../cache/' . $instrument_id . '-' . $from . '-' . $to . '.gz';

		if (!file_exists($archive_file)) {

			$arr = array();
			for ($i = 0; $i < count($quotes); $i++) {
				$time = $quotes[$i]->time;
				$open = $quotes[$i]->open;
				$close = $quotes[$i]->close;
				$high = $quotes[$i]->high;
				$low = $quotes[$i]->low;
				$volume = $quotes[$i]->volume;
				$arr[] = $time . ';' . $open . ';' . $close . ';' . $high . ';' . $low . ';' . $volume;
			}
			$handle = fopen($file_path, "a");
			foreach ($arr as $value) {
				fputcsv($handle, explode(";", $value), ";");
			}
			fclose($handle);

			$data = file_get_contents($file_path);
			$gzip_data = gzencode($data, 9);
			$handle = fopen($archive_file, "a");
			if (flock($handle, LOCK_EX)) {
				fwrite($handle, $gzip_data);
			}
			flock($handle, LOCK_UN); // снятие блокировки
			fclose($handle);

			unlink($file_path);

		}

		return $archive_file;
	}

	public function getCSV($file_name) {
		$archive_file = '../cache/' . $file_name;

		if (file_exists($archive_file)) {

			$gzip_data = file_get_contents($archive_file);
			$data = gzdecode($gzip_data);
			$temp_file = '../cache/' . $this->prefix . '-temp.csv';
			file_put_contents($temp_file, $data);

			$handle = fopen($temp_file, "r");
			$quotes = array();
			while (($cols = fgetcsv($handle, 0, ";")) !== false) {
				$values = array();
				for ($i = 0; $i < count($cols); $i++) {
					switch ($i) {
						case 0:
							$values['time'] = $cols[$i];
							break;
						case 1:
							$values['open'] = $cols[$i];
							break;
						case 2:
							$values['close'] = $cols[$i];
							break;
						case 3:
							$values['high'] = $cols[$i];
							break;
						case 4:
							$values['low'] = $cols[$i];
							break;
						case 5:
							$values['value'] = $cols[$i];
							break;
						default:
							break;
					}
				}
				$quotes[] = $values;
			}
			fclose($handle);

			unlink($temp_file);

			return $quotes;
		} else {
			return false;
		}
	}
}