/**
 * Created by ielovskiy
 */
$(document).ready(function () {

    $('.body-div').css('opacity', 1);

    function DD() {

        var dd = this;

        this.accountCurrency = 'USD';
        this.showConnectSettings = false;
        this.server = 'wss://trade.gfbroker.com:8891';
        this.login = 'ratio';
        this.password = 'ratio';
        this.delimiter = ';';
        this.step = '300';

        this.seconds = 0;
        this.timer = null;
        this.waitTimer = null;
        this.deposit = null;
        this.rawTrades = [];
        this.trades = [];
        this.firstUnixTime = null;
        this.lastUnixTime = null;
        this.instrumentsList = [];

        this.prefix = null;

        this.init = function () {
            this.applyStyles();
            this.applyTimeZones();
            this.hideConnectSettings();
            this.addFormSubmitAction();
        };

        this.getDelimiter = function () {
            var delimiterElement = $('#delimiter');
            var value = $(delimiterElement).val();
            if (value !== '') {
                this.delimiter = value;
            }
            return this.delimiter;
        };

        this.applyStyles = function () {
            $(function () {
                $('input, select').styler({
                    locale: 'en',
                    locales: {
                        'en': {
                            filePlaceholder: 'No file selected',
                            fileBrowse: 'Browse...',
                            fileNumber: 'Selected files: %s',
                            selectPlaceholder: 'Select...',
                            selectSearchNotFound: 'No matches found',
                            selectSearchPlaceholder: 'Search...'
                        }
                    }
                });
            });
        };

        this.applyTimeZones = function () {
            var selectOptions = $('#timezone').children(), option, offset;
            for (var i = 0; i < selectOptions.length; i++) {
                option = selectOptions[i];
                offset = moment().tz($(option).val()).format('Z');
                $(option).text(offset + ' ' + $(option).val());
                if (offset === '+00:00') {
                    $(option).prop('selected', true);
                }
            }
        };

        this.hideConnectSettings = function () {
            if (this.showConnectSettings === false) {
                $('#server-field').hide();
                $('#login-field').hide();
                $('#password-field').hide();
            }
        };

        this.addFormSubmitAction = function () {

            var formElement = $('#ajax-form');
            var messageElement = $('#message');
            var fileElement = $('#files');
            var log = $('#log');
            var logTitle = $('#log-title');
            var logTime = $('#log-time');
            var url = 'parse.php';
            var submitButtonElement = $('#submit');

            $(formElement).submit(function () {

                event.preventDefault();
                dd.setConnectSettings();
                dd.stopTime();
                dd.seconds = 0;
                dd.trades = [];

                if (dd.validate() === true) {

                    $(submitButtonElement).hide();

                    $(logTitle).show();
                    $(logTime).show();
                    dd.runCountUp();
                    $(log).empty();
                    $(log).show();
                    $(log).append(dd.addInLog({text: 'Start parsing file'}));

                    $(messageElement).hide();
                    var formData = new FormData(this);
                    formData.append('type', 'parse');
                    formData.append('delimiter', dd.getDelimiter());
                    $.each(fileElement[0].files, function (i, file) {
                        formData.append('file-' + i, file, file.name);
                        dd.generatePrefix(file.name);
                    });
                    formData.append('prefix', dd.prefix);

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
                            $(log).append(dd.addInLog({text: data.error, status: 'error'}));
                        } else {
                            dd.rawTrades = data.trades;
                            dd.deposit = data.deposit;
                            $(log).append(dd.addInLog({text: 'Total trades: ' + dd.rawTrades.length + ', deposit: ' + dd.deposit + ' (' + dd.accountCurrency + ')'}));
                            dd.prepareTrades();

                        }
                    });

                    post.fail(function (jqXHR, textStatus, errorThrow) {
                        console.log(jqXHR);
                        $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                        dd.stopTime();
                    });

                } else {
                    $(messageElement).text('Error: All fields are required');
                    $(messageElement).show();
                }
            });
        };

        this.prepareTrades = function () {

            var log = $('#log');
            var timezoneElement = $('#timezone');

            if (this.rawTrades.length > 0) {

                var asyncGetInstrumentsList = this.getInstrumentsList();
                asyncGetInstrumentsList.done(function (e) {
                    dd.instrumentsList = e.data.detail;

                    var offsetTimeZone = moment.tz($(timezoneElement).val()).utcOffset() * 60;
                    var openUnixTime, closeUnixTime, openDate, closeDate;
                    var arrOpenTime = [], arrCloseTime = [];
                    var instrumentId, instrumentObjForConvert, incorrect;
                    for (var i = 0; i < dd.rawTrades.length; i++) {

                        incorrect = false;

                        openUnixTime = (moment(dd.rawTrades[i]['open_date'], "MM-DD-YYYY HH:mm").unix() + moment().utcOffset() * 60) + offsetTimeZone;
                        closeUnixTime = (moment(dd.rawTrades[i]['close_date'], "MM-DD-YYYY HH:mm").unix() + moment().utcOffset() * 60) + offsetTimeZone;

                        // 12:23 - 12:23 => 12:23:00-12:24:00
                        if (openUnixTime === closeUnixTime) {
                            openUnixTime = moment(openUnixTime * 1000).second(0).unix();
                            closeUnixTime = moment(closeUnixTime * 1000).minute(moment(closeUnixTime * 1000).get('minute') + 1).second(0).unix();
                        }

                        instrumentId = dd.getInstrumentId(dd.rawTrades[i]['instrument']);
                        if (instrumentId === null) {
                            /*$(log).append(dd.addInLog({
                                text: 'Error: Not found instrument id (' + dd.rawTrades[i]['instrument'] + '), trade # ' + (i + 1) + ' will be skipped',
                                status: 'error'
                            }));*/
                            incorrect = true;
                        }

                        instrumentObjForConvert = dd.getInstrumentIdForConvert(dd.rawTrades[i]['instrument']);
                        if (instrumentObjForConvert === null) {
                            /*$(log).append(dd.addInLog({
                                text: 'Error: Not found instrument id (' + dd.rawTrades[i]['instrument'] + ') for convert to ' + dd.accountCurrency + ', trade # ' + (i + 1) + ' will be skipped',
                                status: 'error'
                            }));*/
                            incorrect = true;
                        }

                        openDate = moment.unix(openUnixTime).format('YYYY-MM-DD HH:mm:ss');
                        closeDate = moment.unix(closeUnixTime).format('YYYY-MM-DD HH:mm:ss');
                        dd.trades.push({
                            open_unix_time: openUnixTime,
                            close_unix_time: closeUnixTime,
                            open_date: openDate,
                            close_date: closeDate,
                            open_price: dd.rawTrades[i]['open_price'],
                            instrument: dd.rawTrades[i]['instrument'],
                            action: dd.rawTrades[i]['action'],
                            lots_count: dd.rawTrades[i]['lots_count'],
                            instrument_id: instrumentId,
                            convert_instrument: instrumentObjForConvert['instrument'],
                            convert_instrument_id: instrumentObjForConvert['instrumentId'],
                            convert_direction: instrumentObjForConvert['direction'],
                            trade_number: i + 1,
                            incorrect: incorrect
                        });
                        arrOpenTime.push(openUnixTime);
                        arrCloseTime.push(closeUnixTime);
                    }
                    arrOpenTime.sort(dd.compareNumeric);
                    arrCloseTime.sort(dd.compareNumeric);
                    dd.firstUnixTime = arrOpenTime[0];
                    dd.lastUnixTime = arrCloseTime[arrCloseTime.length - 1];

                    $(log).append(dd.addInLog({text: 'Get instruments'}));

                    dd.prepareQuotes();
                });
                asyncGetInstrumentsList.fail(function (jqXHR, textStatus, errorThrow) {
                    console.log(jqXHR);
                    $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                    dd.stopTime();
                });

            } else {
                $(log).append(dd.addInLog({text: 'Error: Trades not found', status: 'error'}));
                dd.stopTime();
            }
        };

        this.compareNumeric = function (a, b) {
            return a - b;
        };

        this.setConnectSettings = function () {
            var serverElement = $('#server');
            var loginElement = $('#login');
            var passwordElement = $('#password');
            this.server = ($(serverElement).val() !== '') ? $(serverElement).val() : this.server;
            this.login = ($(loginElement).val() !== '') ? $(loginElement).val() : this.login;
            this.password = ($(passwordElement).val() !== '') ? $(passwordElement).val() : this.password;
        };

        this.validate = function () {

            var isValid = false;
            var msgElement = $('#message');

            var timezoneElement = $('#timezone');
            var delimiterElement = $('#delimiter');
            var fileElement = $('#files');
            var serverElement = $('#server');
            var loginElement = $('#login');
            var passwordElement = $('#password');

            var files = $(fileElement)[0].files;

            [timezoneElement, fileElement].map(function (el) {
                $(el).on('change', function () {
                    $(msgElement).hide();
                });
            });

            [delimiterElement, serverElement, loginElement, passwordElement].map(function (el) {
                $(el).on('input cut paste', function () {
                    $(msgElement).hide();
                });
            });

            if (
                this.delimiter !== '' &&
                this.server !== '' &&
                this.login !== '' &&
                this.password !== ''
            ) {
                if (files.length > 0) {
                    var isFileValid = false;
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        //if (!file.type.match('image.*')) {
                        var pattern = "^.+\.(xls|csv)$";
                        if (file.name.search(pattern) !== -1) {
                            isFileValid = true;
                        }
                    }
                    isValid = isFileValid !== false;
                } else {
                    isValid = false;
                }
            }

            return isValid;
        };

        this.runCountUp = function () {

            var sec = 0;
            dd.timer = setInterval(function () {
                document.getElementById('sec').innerHTML = pad(++sec % 60);
                document.getElementById('min').innerHTML = pad(parseInt('' + sec / 60, 10));
                dd.seconds = dd.seconds + 1;
            }, 1000);
            setTimeout(function () {
                clearInterval(dd.timer)
            }, 72000000);
            var pad = function (val) {
                return val > 9 ? val : '0' + val;
            };
        };

        this.stopTime = function () {
            clearInterval(this.timer);
            clearInterval(this.waitTimer);
        };

        this.addInLog = function (obj) {
            var color = "#000;";
            if (obj.status === 'error') {
                color = "red;";
            }
            if (obj.status === 'success') {
                color = "green;";
            }
            if (obj.status === 'note') {
                color = "blue;";
            }
            var text = obj.text;
            var id = (obj.id) || '';
            return '<div style="color: ' + color + '" class="log-row" id="' + id + '">' + text + '</div>';
        };

        this.getInstrumentsList = function () {

            var d = $.Deferred();

            var linkWebSocket = this.server;

            var transport = new TransportCLS();
            transport.init([linkWebSocket]);
            transport.connect();
            transport.onConnected = function () {
                transport.requestLogin(
                    dd.login,
                    dd.password,
                    'ru'
                );
                transport.connected = true;
            };

            document.addEventListener('onInstrumentsListTransport', function (data) {
                // Close the connection after receiving the data
                transport.disconnect(true, function () {
                    // disconnect
                    d.resolve({data: data});
                });
            }.bind(null), false);

            return d;
        };

        this.prepareQuotes = function () {

            var log = $('#log');
            $(log).append('<div class="log-row"><div id="quotes-count">Get quotes</div><div id="get-quotes-wait"></div></div>');

            var waitId = $('#get-quotes-wait');
            var html = '';
            this.waitTimer = setInterval(function () {
                if ($(waitId).text().length > 0) {
                    html = '';
                }
                else {
                    html = ' <span style="font-size: 10px; margin-left: 10px;">please wait</span>';
                }
                $(waitId).html(html);
            }, 500);

            var i = 0;
            get(this.trades[i]);

            function get(trade) {

                if (trade.incorrect === false) {

                    var countRow = $('#quotes-count');
                    var html = '<div>Get quotes: ' + (i + 1) + '</div>';
                    $(countRow).html(html);

                    var instrumentId = trade['instrument_id'];
                    var openUnixTime = trade['open_unix_time'];
                    var closeUnixTime = trade['close_unix_time'];
                    var convertInstrumentId = trade['convert_instrument_id'];

                    // Check quotes in server cache
                    var asyncGetCache = dd.getCache({
                        instrumentId: instrumentId,
                        convertInstrumentId: convertInstrumentId
                    }, 60, 60, openUnixTime, closeUnixTime);

                    $.when(asyncGetCache).done(function (result) {

                        // Cache not found
                        if (result.data === false) {

                            // Get quotes from wss
                            var asyncGetQuotes, asyncGetQuotesForConvert;
                            asyncGetQuotes = dd.getQuotes('trade-' + i, instrumentId, 60, 60, openUnixTime, closeUnixTime);
                            asyncGetQuotesForConvert = dd.getQuotesForConvert('convert-' + i, convertInstrumentId, 60, 60, openUnixTime, closeUnixTime);

                            $.when(asyncGetQuotes, asyncGetQuotesForConvert).done(function (dataQuotes, dataQuotesForConvert) {

                                if (dataQuotes.data && Array.isArray(dataQuotes.data.detail['ListQuotes']) && dataQuotes.data.detail['ListQuotes'].length === 0) {
                                    trade.incorrect = true;
                                }
                                if (dataQuotesForConvert.data && Array.isArray(dataQuotesForConvert.data.detail['ListQuotes']) && dataQuotesForConvert.data.detail['ListQuotes'].length === 0) {
                                    trade.incorrect = true;
                                }

                                var toCache = {
                                    quotes: dataQuotes.data.detail,
                                    convert_quotes: (dataQuotesForConvert.data !== null) ? dataQuotesForConvert.data.detail : null,
                                    instrument_id: trade['instrument_id'],
                                    open_unix_time: trade['open_unix_time'],
                                    close_unix_time: trade['close_unix_time']
                                };

                                // Record quotes in server cache
                                var asyncSetCache = dd.setCache(toCache);

                                $.when(asyncSetCache).done(function (result) {

                                    trade['quotes_cache_name'] = result.data['quotes_cache_name'];
                                    trade['convert_quotes_cache_name'] = result.data['convert_quotes_cache_name'];

                                    i = i + 1;
                                    (!!dd.trades[i]) ? get(dd.trades[i]) : dd.calculate();

                                });

                                asyncSetCache.fail(function (jqXHR, textStatus, errorThrow) {
                                    console.log(jqXHR);
                                    $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                                    dd.stopTime();
                                });
                            });

                            asyncGetQuotes.fail(function (jqXHR, textStatus, errorThrow) {
                                console.log(jqXHR);
                                $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                                dd.stopTime();
                            });

                            asyncGetQuotesForConvert.fail(function (jqXHR, textStatus, errorThrow) {
                                console.log(jqXHR);
                                $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                                dd.stopTime();
                            });

                        } else {
                            // Cache is found
                            trade['quotes_cache_name'] = result.data['quotes_cache_name'];
                            trade['convert_quotes_cache_name'] = result.data['convert_quotes_cache_name'];

                            i = i + 1;
                            (!!dd.trades[i]) ? get(dd.trades[i]) : dd.calculate();
                        }
                    });

                    asyncGetCache.fail(function (jqXHR, textStatus, errorThrow) {
                        console.log(jqXHR);
                        $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                        dd.stopTime();
                    });

                } else {

                    i = i + 1;
                    (!!dd.trades[i]) ? get(dd.trades[i]) : dd.calculate();

                }
            }

        };

        this.getInstrumentId = function (instrument) {

            for (var instrumentId in this.instrumentsList) {
                if (this.instrumentsList.hasOwnProperty(instrumentId)) {
                    if (this.instrumentsList[instrumentId]['Ticker'] === instrument) {
                        return instrumentId;
                    }
                }
            }
            return null;
        };

        this.getInstrumentIdForConvert = function (instrument) {

            if (instrument.indexOf(this.accountCurrency) === -1) {
                var id, instrumentForConvert, instrumentId, direction = 'direct';

                var required = instrument.slice(-3);
                var directPair = required + '/' + this.accountCurrency;
                instrumentForConvert = directPair;

                for (instrumentId in this.instrumentsList) {
                    if (this.instrumentsList.hasOwnProperty(instrumentId)) {
                        if (this.instrumentsList[instrumentId]['Ticker'] === directPair) {
                            id = instrumentId;
                            break;
                        }
                    }
                }

                if (!id) {
                    var reversePair = this.accountCurrency + '/' + required;
                    instrumentForConvert = reversePair;
                    direction = 'reverse';
                    for (instrumentId in this.instrumentsList) {
                        if (this.instrumentsList.hasOwnProperty(instrumentId)) {
                            if (this.instrumentsList[instrumentId]['Ticker'] === reversePair) {
                                id = instrumentId;
                                break;
                            }
                        }
                    }
                }

                if (id) {
                    return {instrument: instrumentForConvert, instrumentId: id, direction: direction};
                } else {
                    return null;
                }
            } else {
                return {instrument: null, instrumentId: null, direction: null};
            }


        };

        this.getQuotes = function (id, instrumentId, periodM, periodB, from, to) {

            var d = $.Deferred();

            var linkWebSocket = this.server;
            var transport = new TransportCLS();
            transport.init([linkWebSocket]);
            transport.connect();
            transport.onConnected = function () {
                transport.requestLogin(
                    dd.login,
                    dd.password,
                    'ru'
                );
                transport.connected = true;
                transport.requestQuotesHistory(id, instrumentId, periodM, periodB, from, to);

            };

            document.addEventListener('onHistoryBarsTransport', function (data) {
                // console.log(data);
                // Close the connection after receiving the data
                if (id === data.detail.RequestId) {
                    transport.disconnect(true, function () {
                        // disconnect
                        d.resolve({data: data});
                    });
                }
            }.bind(null), false);

            return d;

        };

        this.getQuotesForConvert = function (id, instrumentId, periodM, periodB, from, to) {

            var d = $.Deferred();

            if (instrumentId === null) {
                // Quotes not required
                d.resolve({data: null});

            } else {
                var linkWebSocket = this.server;
                var transport = new TransportCLS();
                transport.init([linkWebSocket]);
                transport.connect();
                transport.onConnected = function () {
                    transport.requestLogin(
                        dd.login,
                        dd.password,
                        'ru'
                    );
                    transport.connected = true;
                    transport.requestQuotesHistory(id, instrumentId, periodM, periodB, from, to);

                };

                document.addEventListener('onHistoryBarsTransportConvert', function (data) {
                    // console.log(data);
                    // Close the connection after receiving the data
                    if (id === data.detail.RequestId) {
                        transport.disconnect(true, function () {
                            // disconnect
                            d.resolve({data: data});
                        });
                    }
                }.bind(null), false);
            }

            return d;
        };

        this.getCache = function (instrumentIds, periodM, periodB, from, to) {

            var d = $.Deferred();

            var log = $('#log');
            var url = 'cache.php';

            var formData = new FormData();
            formData.append('type', 'get_cache');
            formData.append('prefix', dd.prefix);
            formData.append('instrument_id', JSON.stringify(instrumentIds['instrumentId']));
            formData.append('convert_instrument_id', JSON.stringify(instrumentIds['convertInstrumentId']));
            formData.append('from', from);
            formData.append('to', to);

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
                d.resolve({data: data.result});
            });

            post.fail(function (jqXHR, textStatus, errorThrow) {
                console.log(jqXHR);
                $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                dd.stopTime();
            });

            return d;
        };

        this.setCache = function (trade) {

            var d = $.Deferred();

            if ((trade['quotes'] && Array.isArray(trade['quotes']['ListQuotes']) && trade['quotes']['ListQuotes'].length === 0) ||
                (trade['convert_quotes'] && Array.isArray(trade['convert_quotes']['ListQuotes']) && trade['convert_quotes']['ListQuotes'].length === 0)
            ) {
                d.resolve({data: {quotes_cache_name: null, convert_quotes_cache_name: null}});
            } else {
                var log = $('#log');
                var url = 'cache.php';

                var formData = new FormData();
                formData.append('type', 'set_cache');
                formData.append('prefix', dd.prefix);
                formData.append('trade', JSON.stringify(trade));

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
                    d.resolve({data: data.result});
                });

                post.fail(function (jqXHR, textStatus, errorThrow) {
                    console.log(jqXHR);
                    $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                    dd.stopTime();
                });
            }
            return d;
        };

        this.calculate = function () {

            clearInterval(this.waitTimer);
            $('#get-quotes-wait').text('');

            var log = $('#log');
            var text = 'Calculate';
            $(log).append(this.addInLog({text: text, id: 'calculate'}));

            var logRow = $('#calculate');
            var html = 'Calculate';
            this.waitTimer = setInterval(function () {
                if ($(logRow).text().length > 10) {
                    html = 'Calculate';
                } else {
                    html = 'Calculate <span style="font-size: 10px; margin-left: 10px;">please wait</span>'
                }
                $(logRow).html(html);
            }, 500);

            var url = 'calculate.php';

            var formData = new FormData();
            formData.append('type', 'calc');
            formData.append('prefix', dd.prefix);
            formData.append('instruments_list', JSON.stringify(this.instrumentsList));
            formData.append('trades', JSON.stringify(this.trades));
            formData.append('deposit', this.deposit);
            formData.append('account_currency', this.accountCurrency);
            formData.append('step', this.step);
            formData.append('first_unix_time', this.firstUnixTime);
            formData.append('last_unix_time', this.lastUnixTime);
            formData.append('file_name', this.prefix);

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
                    $(log).append(dd.addInLog({text: data.error, status: 'error'}));
                    dd.stopTime();
                } else {
                    dd.stopTime();
                    $(logRow).text('Calculate: ok');
                    $(log).append(dd.addInLog({text: 'Calculate complete', status: 'success'}));
                    $(log).append(dd.addInLog({text: data.message, status: 'success'}));
                    dd.putTimeInFile(data['result'], data['file_name']);
                }
            });

            post.fail(function (jqXHR, textStatus, errorThrow) {
                console.log(jqXHR);
                $(log).append(dd.addInLog({text: 'Error: Async Deferred Fail', status: 'error'}));
                dd.stopTime();
            });

        };

        this.putTimeInFile = function (result, fileName) {
            var log = $('#log');

            var submitButtonElement = $('#submit');
            var formElement = $('#ajax-form');
            var url = $(formElement).attr('action');

            var formData = new FormData();
            formData.append('type', 'total');
            formData.append('prefix', dd.prefix);
            formData.append('file_name', fileName);
            formData.append('account_currency', this.accountCurrency);
            formData.append('absolute_draw_down', result['absolute_draw_down'] + '');
            formData.append('min_points', result['min_points'] + '');
            formData.append('percent_of_draw_down', result['percent_of_draw_down'] + '');
            formData.append('time', this.seconds + '');

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
                $(log).append('<div class="log-row"><a href="../results/' + data['file_name'] + '" download>Download</a></div>');
                $(submitButtonElement).show();
                console.log('Well done!');
            });

            post.fail(function (jqXHR, textStatus, errorThrow) {
                console.log(jqXHR);
            });
        };

        this.generatePrefix = function (fileName) {
            var part = fileName.replace(/[^A-Za-z0-9]+/, '-');
            dd.prefix = part + '-' + Math.random().toString(36).substring(7);
            $('#log-title-link').attr('href', '../logs/' + dd.prefix + '-process.log');
        };

    }

    var dd = new DD();
    dd.init();

});