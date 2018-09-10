<?php
/**
 * Created by ielovskiy
 */
if (!isset($_SESSION)) {
	session_start();
}

if (isset($_SESSION) && $_SESSION['name'] && $_POST["type"] === 'calc') {
	ini_set('error_reporting', E_ALL);
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	set_time_limit(86400);
	ini_set('memory_limit', '3000M');
	ignore_user_abort(true);
	date_default_timezone_set('America/New_York');

	require_once 'writer.php';

	$instruments_list = $_POST["instruments_list"];
	$trades = $_POST["trades"];
	$deposit = $_POST["deposit"];
	$account_currency = $_POST["account_currency"];
	$step = $_POST["step"];
	$first_unix_time = $_POST["first_unix_time"];
	$last_unix_time = $_POST["last_unix_time"];
	$prefix = $_POST["prefix"];

	if (
		empty($_POST["instruments_list"]) ||
		empty($_POST["trades"]) ||
		empty($deposit) ||
		empty($account_currency) ||
		empty($step) ||
		empty($first_unix_time) ||
		empty($last_unix_time) ||
		empty($prefix)
	) {
		Writer::inProcessLog('Error: No data. Will be skipped', $prefix);
		echo json_encode(array('error' => 'Error: No data. Will be skipped'));
		exit;
	}

	$trades = json_decode($_POST["trades"]);
	$instruments_list = json_decode($_POST["instruments_list"]);

	Writer::inProcessLog('Received: ' . count($trades) . ' trade(s)', $prefix);

	$calculate = new Calculate();
	$calculate->prefix = $prefix;
	$calculate->instruments_list = $instruments_list;
	$calculate->trades = $trades;
	$calculate->deposit = $deposit;
	$calculate->account_currency = $account_currency;
	$calculate->step = $step;
	$calculate->first_unix_time = $first_unix_time;
	$calculate->last_unix_time = $last_unix_time;

	$calculate->init();
	$result = $calculate->getResult();
	$absolute_draw_down = ($result['absolute_draw_down'] < 0) ? round($result['absolute_draw_down'], 2) : 'none';
	$min_points = ($result['min_points'] < 0) ? round($result['min_points'], 2) : 'none';
	$percent_of_draw_down = ($result['percent_of_draw_down'] < 0) ? round($result['percent_of_draw_down'], 2) : 'none';

	$a_text = is_numeric($absolute_draw_down) ? $absolute_draw_down . ' (' . $account_currency . ')' : $absolute_draw_down;
	$b_text = is_numeric($percent_of_draw_down) ? $percent_of_draw_down . '%' : $percent_of_draw_down;
	$prefix = preg_replace("/[^A-Za-z0-9]+/", '-', $prefix);
	$file_name = Writer::inFile("All operation completed!\r\nAbsolute draw down: " . $a_text . "\r\nMin. points: " . $min_points . "\r\nPercent of draw down: " . $b_text . "\r\n", null, $prefix);

	echo json_encode(array(
			'message'   => 'Absolute draw down: ' . $absolute_draw_down . ' (' . $account_currency . '), min. points: ' . $min_points . ', percent of draw down: ' . $percent_of_draw_down . ' (%)',
			'result'    => array(
				'absolute_draw_down'   => $absolute_draw_down,
				'min_points'           => $min_points,
				'percent_of_draw_down' => $percent_of_draw_down
			),
			'file_name' => $file_name
		)
	);

}


class Calculate {

	public $prefix;
	public $instruments_list;
	public $trades;
	public $deposit;
	public $account_currency;
	public $step;
	public $first_unix_time;
	public $last_unix_time;
	public $convert_quotes;
	public $convert_direction;
	public $absolute_draw_down = 0;
	public $quotes = array();

	public $result = null;

	public function init() {

		$first_date = new DateTime();
		$first_date->setTimestamp($this->first_unix_time);
		$last_date = new DateTime();
		$last_date->setTimestamp($this->last_unix_time);
		Writer::inProcessLog('Time range: ' . $first_date->format('Y-m-d H:i:s (U)') . ' - ' . $last_date->format('Y-m-d H:i:s (U)'), $this->prefix);
		$this->quotasDistribution();

	}

	public function quotasDistribution() {
		Writer::inProcessLog('The distribution of quotas is started', $this->prefix);

		require_once 'cache.php';
		$cache = new Cache();

		$live_count = 0;

		$lots_sizes = array();
		$times = [];
		$current_unix_time = $this->first_unix_time;
		while ($current_unix_time <= $this->last_unix_time) {
			$current_unix_time = $current_unix_time + $this->step;
			$live_count = $live_count + 1;
			if ($live_count === 1000) {
				$date = new DateTime();
				$date->setTimestamp($current_unix_time);
				Writer::inProcessLog('All is well! Calculation for this time: ' . $date->format('Y-m-d H:i:s (U)'), $this->prefix);
				$live_count = 0;
			}

			for ($i = 0; $i < count($this->trades); $i++) {

				if ($this->trades[$i]->incorrect === true) {
					continue;
				}

				$open_unix_time = $this->trades[$i]->open_unix_time;
				$close_unix_time = $this->trades[$i]->close_unix_time;

				if ($current_unix_time >= $open_unix_time && $current_unix_time <= $close_unix_time) {

					$quotes = $this->getQuotes($this->trades[$i]->trade_number, $this->trades[$i]->quotes_cache_name, $cache);

					$n = 0;
					for ($j = 0; $j < count($quotes); $j++) {

						$time = $quotes[$j]['time'] / 1000;
						if ($current_unix_time === $time) {
							$n = $j;
							break;
						}
					}

					$start_price = $this->trades[$i]->open_price;
					$action = $this->trades[$i]->action;
					$lot_size = $this->getInstrumentLotSize($this->trades[$i]->instrument_id);
					$lots_sizes[$this->trades[$i]->instrument_id] = array(
						'instrument' => $this->trades[$i]->instrument,
						'lot_size'   => $lot_size
					);
					$lot_count = $this->trades[$i]->lots_count;
					$convert_quotes = $this->getQuotes($this->trades[$i]->trade_number, $this->trades[$i]->convert_quotes_cache_name, $cache);
					$convert_tools = array(
						'instrument'        => $this->trades[$i]->instrument,
						'convert_direction' => $this->trades[$i]->convert_direction,
						'convert_quotes'    => (isset($this->trades[$i]->convert_instrument)) ? $convert_quotes : null
					);

					$average_price = ($quotes[$n]['open'] + $quotes[$n]['close'] + $quotes[$n]['high'] + $quotes[$n]['low']) / 4;
					if (mb_strtolower($action) === 'buy') {
						$value = $average_price - $start_price;

					} else {
						$value = $start_price - $average_price;
					}
					$convert_tools['value'] = $value;
					$convert_tools['time'] = $quotes[$n]['time'];
					$convert_tools['price'] = $average_price;
					$volume_in_account_currency = round($this->convert($convert_tools) * $lot_size * $lot_count, 2);
					$volume_in_points = round($value * $lot_size, 2);
					$times[$current_unix_time][] = array(
						'average_price'              => $average_price,
						'volume_in_account_currency' => $volume_in_account_currency,
						'volume_in_points'           => $volume_in_points,
						'trade_number'               => $this->trades[$i]->trade_number
					);
				}
			}
		}

		foreach ($lots_sizes as $key => $values) {
			Writer::inProcessLog('Lot size for ' . $values['instrument'] . ' (' . $key . '): ' . $values['lot_size'], $this->prefix);
		}

		unset($this->trades);
		Writer::inProcessLog('The distribution of quotas is completed', $this->prefix);
		$this->getAbsoluteDrawDown($times);
	}

	public function getQuotes($trade_number, $cache_name, $cache) {
		$cache->prefix = $this->prefix;
		if (!isset($this->quotes[$trade_number])) {
			$this->quotes[$trade_number] = $cache->getCSV($cache_name);
		}

		return $this->quotes[$trade_number];
	}

	public function getAbsoluteDrawDown($times) {
		Writer::inProcessLog('Result calculate is started', $this->prefix);
		//$this->dropData($times);
		$a = array();
		$b = array();
		foreach ($times as $key => $values) {
			$c = 0;
			$d = 0;
			for ($i = 0; $i < count($values); $i++) {
				$c = $c + $values[$i]['volume_in_account_currency'];
				$d = $d + $values[$i]['volume_in_points'];
			}
			$a[] = $c;
			$b[] = $d;
		}

		if (count($a) > 0 && count($b) > 0) {
			$absolute_draw_down = min($a);
			unset($a);
			$min_points = min($b);
			unset($b);

			$this->addPercentOfDrawDown(array(
				'absolute_draw_down' => $absolute_draw_down,
				'min_points'         => $min_points
			));
		}

		Writer::inProcessLog('Result calculate is completed', $this->prefix);
	}

	public function addPercentOfDrawDown($arr) {
		$x = round(($arr['absolute_draw_down'] * 100) / $this->deposit, 2);
		$arr['percent_of_draw_down'] = $x;
		$this->result = $arr;
	}

	public function getInstrumentLotSize($instrument_id) {
		return $this->instruments_list->{$instrument_id}->LotSize;
	}

	public function convert($convert_tools) {

		$last_quotation = null;
		$instrument = $convert_tools['instrument'];
		$value = $convert_tools['value'];
		$price = $convert_tools['price'];
		$time = $convert_tools['time'];
		$convert_quotes = $convert_tools['convert_quotes'];
		$convert_direction = $convert_tools['convert_direction'];

		if (substr($instrument, 0, 3) == $this->account_currency) { // e.g. USD/JPY
			return $value / $price;
		} else if (strpos($instrument, $this->account_currency) === false) { // e.g. AUD/JPY -> AUD/USD

			for ($i = 0; $i < count($convert_quotes); $i++) {
				if ($time === $convert_quotes[$i]['time']) {
					$last_quotation = $convert_quotes[$i]['close'];
					break;
				}
			}

			if ($convert_direction === 'direct') { // XYZ/USD
				return $value * $last_quotation;
			} else { // USD/XYZ
				return $value * (1 / $last_quotation);
			}
		} else { // e.g. EUR/USD
			return $value * 1;
		}
	}

	public function dropData($data) {
		if (!file_exists('../temp')) {
			mkdir('../temp');
		}
		$date = date('Ymd-His', time());
		file_put_contents('../logs/' . $date . '-drop.json', json_encode($data));
	}

	public function getResult() {
		return $this->result;
	}


}