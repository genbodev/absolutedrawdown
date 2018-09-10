/**
 * Created by ebondarev
 * Correct by imikhaylov
 * Correct by ielovskiy
 */

'use strict';

/**
 * Класс для запросов средствами websocket
 * @constructor
 */
function TransportCLS() {

    var rootTransport = this;
    var noop = function () {
    };

    rootTransport.cashServerName = '';

    this.CHANNEL_TRADE = 'Trade';
    this.CHANNEL_QUOTE = 'Quote';

    this.TRANSPORT_NAME_USER = "USER";
    this.TRANSPORT_NAME_HISTORY = "HISTORY";

    this.NOT_LOG_IN = "NOT_LOG_IN";
    this.LOGGING_IN = "LOGGING_IN";
    this.LOGGED_IN = "LOGGED_IN";

    //this.logInStatus = this.NOT_LOG_IN;
    this.isHandleStop = false;
    this.connected = false;
    this.connecting = false;
    this.socket = null;
    //this.errorMessage = "";
    this.reconnectTimer = null;
    this.watchdog = null;
    this.dataReceived = false;
    this.throwRejectWhenNoConnectedSend = true;

    this.onLogin = noop;
    this.onQuote = noop;
    this.onAccountsList = noop;
    this.onInstrumentsList = noop;
    this.onOrdersList = noop;
    this.onPositionsList = noop;
    this.onNewsList = noop;
    this.onNewsAdd = noop;
    this.onAccountUpdate = noop;
    this.onAccountAdd = noop;
    this.onPositionAdd = noop;
    this.onPositionUpdate = noop;
    this.onPositionRemove = noop;
    this.onOrderAdd = noop;
    this.onOrderUpdate = noop;
    this.onOrderRemove = noop;
    this.onHistoryBars = noop;
    this.onHistoryQuotes = noop;
    this.onActivityLog = noop;
    this.onActivityLogUpdate = noop;
    this.onAccountHistory = noop;
    this.onAccountHistoryUpdate = noop;
    this.onCommissionsList = noop;
    this.onSignalSubscriptions = noop;
    this.onSwapsList = noop;
    this.onInstrumentGroupList = noop;
    this.onError = noop;
    this.onConnected = noop;
    this.onClose = noop;
    this.onReject = noop;
    this.onRejectOrder = noop;
    this.onRejectPosition = noop;

    this._urls = [];
    /*this._transportName = 'noname';*/

    this.init = function (urls/*, transportName*/) {
        rootTransport._urls = urls;
        //rootTransport._transportName = transportName || rootTransport.TRANSPORT_NAME_USER;
    };

    this._getRandomServer = function (urls) {
        if (typeof urls === 'string') {
            return rootTransport.cashServerName = urls;
        }
        var randomServer = urls[Math.floor(Math.random() * urls.length)];
        if (rootTransport.cashServerName !== randomServer) {
            return rootTransport.cashServerName = randomServer
        }
    };

    /**
     *
     * @param timeoutIn int
     * @param reconnectTimeoutIn int
     */
    this.connect = function (timeoutIn, reconnectTimeoutIn) {
        var timeout = timeoutIn || 10000, reconnectTimeout = reconnectTimeoutIn || 2000;

        if (rootTransport.reconnectTimer) {
            clearTimeout(rootTransport.reconnectTimer);
            rootTransport.reconnectTimer = null;
        }

        if (rootTransport.connected || rootTransport.connecting) {
            return;
        }

        rootTransport.connecting = true;
        if (!rootTransport.cashServerName) {
            rootTransport._getRandomServer(rootTransport._urls);
        }

        try {
            rootTransport.socket = new WebSocket(rootTransport.cashServerName);
            rootTransport.socket.onopen = function () {
                console.info('WS Opened!!![' + rootTransport.cashServerName + ']');
                rootTransport.connected = true;
                rootTransport.connecting = false;
                rootTransport.onConnected();
                rootTransport.dataReceived = true;
                rootTransport.startWatchDog();
            };
            rootTransport.socket.onclose = function () {
                rootTransport.connecting = false;
                rootTransport.connected = false;
                rootTransport.logInStatus = rootTransport.NOT_LOG_IN;
                if (rootTransport._urls.length > 1 && rootTransport._urls.indexOf(rootTransport.cashServerName) !== -1) {
                    rootTransport._urls.splice(rootTransport._urls.indexOf(rootTransport.cashServerName), 1);
                }
                rootTransport.onClose();
                rootTransport.error('WS Closed!!!');
            };
            rootTransport.socket.onmessage = function (e) {
                rootTransport.message(e.data);
                rootTransport.dataReceived = true;
            };
            rootTransport.socket.onerror = function (e) {
                console.info('Unable connect to the server ' + rootTransport.cashServerName + '!');
                console.error(e);
                rootTransport.onError(e);
            };

            setTimeout(function () {
                if (rootTransport.connected) {
                    return;
                }

                if (!rootTransport.isHandleStop) {
                    console.info('WS time out');
                    rootTransport.error('Time out');
                    rootTransport.reconnectStart(reconnectTimeout);
                }
            }, timeout);

        } catch (err) {
            console.info('WS Exception!!!', err);
            rootTransport.error(err);
            rootTransport.reconnectStart(reconnectTimeout);
        }

    };

    this.disconnect = function (handleStop, callback) {
        rootTransport.requestLogOut();
        rootTransport.isHandleStop = handleStop || false;
        rootTransport.connected = false;
        rootTransport.connecting = false;

        //remove handlers
        if (rootTransport.socket) {

            rootTransport.socket.onclose = function () {
                console.info('Removed WS Closed!!!');
            };
            rootTransport.socket.onerror = function () {
            };
            rootTransport.socket.onmessage = function () {
            };
            rootTransport.socket.onopen = function () {
            };
            rootTransport.socket.close();
            rootTransport.socket = null;
            rootTransport.cashServerName = '';
        }

        if (callback && typeof callback === 'function') {
            callback();
        }

        /*
        var eventDisconnect = new CustomEvent('onDisconnectTransport');
        document.dispatchEvent(eventDisconnect);
        */
    };

    this.reconnectStart = function (intervalIn) {
        var interval = intervalIn || 1000;
        rootTransport.disconnect();
        if (rootTransport.reconnectTimer) {
            return;
        }
        rootTransport.reconnectTimer = window.setTimeout(rootTransport.connect.bind(rootTransport), interval);
    };

    this.startWatchDog = function () {

        window.clearInterval(rootTransport.watchdog);
        rootTransport.watchdog = window.setInterval(function () {
            if (!rootTransport.dataReceived && rootTransport.connected && !rootTransport.isHandleStop) {
                console.info('No heartbeats!!');
                rootTransport.reconnectStart();
                return;
            }

            rootTransport.dataReceived = false;
        }, 30000);
    };

    this.send = function (data) {
        if (!rootTransport.connected && rootTransport.throwRejectWhenNoConnectedSend) {
            rootTransport.onReject('No connection to the server');
        }

        var json = JSON.stringify(data);
        try {
            rootTransport.socket.send(json);
        } catch (err) {
            //console.info("WS SEND Exception!!!\n" + err);
        }
    };

    this.message = function (data) {
        var obj = JSON.parse(data);
        rootTransport.processmessage(obj);
    };

    this.error = function () {
        if (!rootTransport.isHandleStop) {
            console.info('Handle error');
            rootTransport.errorMessage = "Problem connection";
            rootTransport.cashServerName = '';
            // Initialize reconnect
            rootTransport.reconnectStart(3000);
        }
    };


    this.processmessage = function (jsonData) {
        if (!jsonData) {
            return;
        }
        if (jsonData['TypeInfo'] !== "Quote"
            && jsonData['TypeInfo'] !== "Heartbeat") {
        }

        // события выставлены в прорядке частотности
        switch (jsonData['TypeInfo']) {
            case "Quote":
                rootTransport.onQuote(jsonData);
                break;
            case "Heartbeat":
                break;
            case "AccountsList":
                rootTransport.onAccountsList(jsonData['ListAccounts']);
                break;
            case "AccountUpdate":
                rootTransport.onAccountUpdate(jsonData['ListAccounts']);
                break;
            case "AccountAdd":
                rootTransport.onAccountAdd(jsonData['ListAccounts']);
                break;
            case "OrdersList":
                rootTransport.onOrdersList(jsonData['ListOrders']);
                break;
            case "PositionsList":
                rootTransport.onPositionsList(jsonData['ListPositions']);
                break;
            case "Login":
            case "Relogin":
                rootTransport.logInStatus = rootTransport.LOGGED_IN;
                rootTransport.onLogin(jsonData);
                break;
            case "NewsList":
                rootTransport.onNewsList(jsonData['ListNews']);
                break;
            case "NewsAdd":
                rootTransport.onNewsAdd(jsonData['ListNews']);
                break;
            case "ActivityLog":
                rootTransport.onActivityLog(jsonData['ListData']);
                break;
            case "ActivityLogAdd":
                rootTransport.onActivityLogUpdate(jsonData['ListData']);
                break;
            case "PositionAdd":
                rootTransport.onPositionAdd(jsonData['ListPositions']);
                break;
            case "PositionUpdate":
                rootTransport.onPositionUpdate(jsonData['ListPositions']);
                break;
            case "PositionRemove":
                rootTransport.onPositionRemove(jsonData['ListPositions']);
                break;
            case "OrderAdd":
                rootTransport.onOrderAdd(jsonData['ListOrders']);
                break;
            case "OrderUpdate":
                rootTransport.onOrderUpdate(jsonData['ListOrders']);
                break;
            case "OrderRemove":
                rootTransport.onOrderRemove(jsonData['ListOrders']);
                break;
            case "HistoryBars":
                rootTransport.onHistoryBars(jsonData);
                var event0 = new CustomEvent('onHistoryBarsTransport', {'detail': jsonData});
                document.dispatchEvent(event0);
                var event1 = new CustomEvent('onHistoryBarsTransportConvert', {'detail': jsonData});
                document.dispatchEvent(event1);
                break;
            case "HistoryQuotes":
                rootTransport.onHistoryQuotes(jsonData);
                break;
            case "AccountHistoryAdd":
                rootTransport.onAccountHistoryUpdate(jsonData['ListData']);
                break;
            case "AccountHistory":
                rootTransport.onAccountHistory(jsonData['ListData']);
                break;
            case "CommissionsList":
                rootTransport.onCommissionsList(jsonData['ListCommissions']);
                break;
            case "InstrumentsList":
                rootTransport.onInstrumentsList(jsonData['ListInstruments']);
                var event2 = new CustomEvent('onInstrumentsListTransport', {'detail': jsonData['ListInstruments']});
                document.dispatchEvent(event2);
                break;
            case "SwapsList":
                rootTransport.onSwapsList(jsonData['ListSwaps']);
                break;
            case "SignalSubscriptions":
                rootTransport.onSignalSubscriptions(jsonData['ListSignalSubscriptions']);
                break;
            case "InstrumentGroupList":
                rootTransport.onInstrumentGroupList(jsonData['ListInstrumentGroups']);
                break;
            case "Error":
                console.error("Error : " + jsonData['AdditionalData'], jsonData);
                break;
            case "Reject":
                rootTransport.onReject(jsonData['Reason']);
                console.error("Reject : " + jsonData['Reason'], jsonData);
                break;
            case "RejectOrder":
                rootTransport.onRejectOrder(jsonData['Reason']);
                console.error("Reject Order:" + jsonData['Reason'], jsonData);
                break;
            case "RejectPosition":
                rootTransport.onRejectPosition(jsonData['Reason']);
                console.error("Reject Position:" + jsonData['Reason'], jsonData);
                break;

            default:
                console.error("Uncaught transport message: " + jsonData['TypeInfo'], jsonData);
                break;

        }

    };

    this.requestLogin = function (login, password, lang, socketIdIn, channelIn) {
        var socketId = socketIdIn || null, channel = channelIn || rootTransport.CHANNEL_TRADE;
        var cmd = {
            Login: {
                Channel: channel,
                Name: login,
                Password: password,
                Language: lang,
                SocketId: socketId
            }
        };

        rootTransport.send(cmd);
        rootTransport.logInStatus = rootTransport.LOGGING_IN;
    };

        this.requestCancelOrder = function (orderId, accountId) {
            var cmd = {
                Order: "Cancel", //Place, Replace, Cancel
                OrderType: "Market",
                OrderArgs: {
                    OrderNumber: orderId,
                    AccountNumber: accountId
                }
            };
            rootTransport.send(cmd);
        };

        this.requestClosePosition = function (positionId, amount, accountId) {
            var cmd = {
                Position: "Close",
                PositionArgs: {
                    PositionNumber: positionId,
                    Amount: amount,
                    AccountNumber: accountId
                }
            };
            rootTransport.send(cmd);
        };

        this.requestActivityLogHistory = function (fromIn, toIn) {
            var from = fromIn || null, to = toIn || null;
            var request = {
                Report: "ActivityLog",
                FromDate: from,
                ToDate: to
            };

            rootTransport.send(request);
        };

        this.requestAccountHistory = function (fromIn, toIn) {
            var from = fromIn || null, to = toIn || null;
            var request = {
                Report: "AccountHistory",
                FromDate: from,
                ToDate: to
            };

            rootTransport.send(request);
        };

        this.requestCreateOrder = function (type, accountNumber, symbolId, side, price, size, stopLoss, takeProfit) {

            var stopPrice = (type.toLowerCase() === "stop") ? price : 0;
            var request = {
                Order: "Place", //Place, Replace, Cancel
                OrderType: type.toLowerCase(),
                OrderArgs: {
                    AccountNumber: accountNumber,
                    SymbolId: symbolId,
                    Operation: side,  // int
                    Price: price,   // double
                    StopPrice: stopPrice,
                    Amount: size,     // double
                    SLOffset: stopLoss, // double
                    TPOffset: takeProfit, // double
                    TrailingStop: false,
                    TimeInForce: 10008 //int
                }
            };

            rootTransport.send(request);
        };

        this.requestReplaceOrder = function (accountNumber, orderId, type, price, size, boundToIn, stopLossIn, takeProfitIn, trailingStopIn) {
            var boundTo = boundToIn || 0, stopLoss = stopLossIn || 0, takeProfit = takeProfitIn || 0,
                trailingStop = trailingStopIn || false;
            var request = {
                Order: "Replace",
                OrderType: type,
                OrderArgs: {
                    OrderNumber: orderId,
                    Price: price,   // double
                    Amount: size,     // double
                    SLOffset: stopLoss, // double
                    TPOffset: takeProfit, // double
                    TrailingStop: trailingStop,
                    BoundTo: boundTo,
                    AccountNumber: accountNumber
                }
            };

            rootTransport.send(request);
        };

        this.requestSetPositionStopLoss = function (orderId, price, accountId, isPriceIn) {
            var isPrice = isPriceIn || true;
            var request = {
                Position: "SetSL",
                PositionArgs: {
                    PositionNumber: +orderId,
                    Price: +price,
                    ValuesArePrices: isPrice,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestSetPositionTakeProfit = function (orderId, price, accountId, isPriceIn) {
            var isPrice = isPriceIn || true;
            var request = {
                Position: "SetTP",
                PositionArgs: {
                    PositionNumber: +orderId,
                    Price: +price,
                    ValuesArePrices: isPrice,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestCancelPositionStopLoss = function (orderId, accountId) {
            var request = {
                Position: "RemoveSL",
                PositionArgs: {
                    PositionNumber: +orderId,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestCancelPositionTakeProfit = function (orderId, accountId) {
            var request = {
                Position: "RemoveTP",
                PositionArgs: {
                    PositionNumber: +orderId,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestSetOrderSLTP = function (orderId, accountId, stopLossIn, takeProfitIn, isPriceIn) {
            var stopLoss = stopLossIn || '', takeProfit = takeProfitIn || '', isPrice = isPriceIn || true;
            var request = {
                Order: "Place",
                OrderType: "SLTP",
                OrderArgs: {
                    OrderNumber: orderId,
                    SLOffset: stopLoss, // double
                    TPOffset: takeProfit, // double
                    ValuesArePrices: isPrice,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestCancelOrderStopLoss = function (orderId, accountId) {
            var request = {
                Order: "RemoveSL",
                OrderArgs: {
                    OrderNumber: orderId,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestCancelOrderTakeProfit = function (orderId, accountId) {
            var request = {
                Order: "RemoveTP",
                OrderArgs: {
                    OrderNumber: orderId,
                    AccountNumber: accountId
                }
            };

            rootTransport.send(request);
        };

        this.requestQuotesHistory = function (requestId, symbolId, periodM, periodB, from, to) {
            var request = {
                History: "Request",
                HistoryRequest: {
                    SymbolId: symbolId,
                    Ticker: "",
                    Period: {
                        MainPeriod: periodM,
                        BasePeriod: periodB
                    },
                    StartTime: from,
                    EndTime: to,
                    RequestId: requestId
                }
            };

            rootTransport.send(request);
        };

    this.requestLogOut = function (socketIdIn) {
        var socketId = socketIdIn || null;
        var request = {
            Logout: "Logout",
            SocketId: socketId
        };

        rootTransport.send(request);
        rootTransport.logInStatus = rootTransport.NOT_LOG_IN;
    };

}