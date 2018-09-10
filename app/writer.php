<?php

class Writer {

	public static function inProcessLog($text, $prefix) {
		if (!file_exists('../logs')) {
			mkdir('../logs');
		}
		$date = date('Y-m-d H:i:s', time());
		$file_name = "../logs/" . $prefix . "-process.log";
		$fd = fopen($file_name, "a+b");
		fwrite($fd, $date . ' ' . $text . "\r\n");
		fclose($fd);
	}

	public static function inFile($text, $file_name, $prefix) {
		if (!file_exists('../results')) {
			mkdir('../results');
		}
		$date = date('Ymd-His', time());
		if (!$file_name) {
			$file_name = $prefix . '-' . 'result-' . $date . '.txt';
		}
		$fd = fopen("../results/" . $file_name, "a+b");
		fwrite($fd, $text . "\r\n");
		fclose($fd);

		return $file_name;
	}

}