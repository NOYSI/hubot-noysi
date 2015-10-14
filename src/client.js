'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _log = require('log');

var _log2 = _interopRequireDefault(_log);

var _events = require('events');

function NoysiClient(token) {

  _events.EventEmitter.call(this);

  var authenticated = false;
  var connected = false;
  var url = null;
  var ws = null;

  //var i              = 0;

  var log = new _log2['default']('debug');

  var self = this;

  var pongTimeout = undefined;
  var lastPong = undefined;

  var reconnectTimer = undefined;

  var options;

  this.init = function (hostname) {
    options = {
      hostname: hostname,
      method: 'PUT',
      path: '/v1/authorize',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': 0
      }
    };
    this.start();
  };

  this.start = function () {

    var req = _https2['default'].request(options);

    req.on('response', function (res) {

      var buffer = '';

      res.on('data', function (chunk) {

        buffer += chunk;
      });

      res.on('end', function () {

        if (res.statusCode == 200) {
          var value = JSON.parse(buffer);
          authenticated = true;
          self.connect(value.url);
        } else {
          self.onError({ error: 'API response: ' + res.statusCode });
          authenticated = false;
        }
      });
    });

    req.on('error', function (error) {

      self.onError(error);

      //if callback? then callback({'ok': false, 'error': error.errno})
    });

    req.write('');
    req.end();
  };

  this.connect = function (url) {
    log.debug('connect ' + url);
    if (!url) {
      return false;
    } else lastPong = Date.now();
    ws = new _ws2['default'](url);
    ws.on('open', function () {

      var ping = function ping() {
        if (!connected) return;
        self.send({ "type": "ping" });
      };

      pongTimeout = setInterval(ping, 5000);
    });

    ws.on('message', function (data, flags) {

      self.onMessage(JSON.parse(data));
    });

    ws.on('error', function (error) {
      self.onError(error);
    });

    ws.on('close', function () {
      connected = false;
      url = null;
      self.waitAndReconnect();
    });

    return true;
  };

  this.disconnect = function () {

    log.debug("Disconnected");

    if (pongTimeout) {
      clearInterval(pongTimeout);
      pongTimeout = undefined;
    }
    if (connected) {
      ws.close();
    }
  };

  this.onMessage = function (message) {

    if (!message.type) {
      return;
    }

    if (message.type == 'message' && message.uid == 'noysi:robot') {
      return;
    }

    try {

      switch (message.type) {
        case "pong":
          if (lastPong && Date.now() - lastPong > 30000)
            //log.error("Last pong is too old: %d", (Date.now() - @_lastPong) / 1000)
            self.disconnect();else lastPong = Date.now();
          break;
        case "hello":
          connected = true;
          self.emit('open');
          break;
        default:
          self.emit('message', message);
      }
    } catch (e) {
      log.error(e);
    }
  };

  this.send = function (message) {
    if (!connected) {
      return false;
    } else {
      //message.id = ++i
      ws.send(JSON.stringify(message));
      return message;
    }
  };

  this.onError = function (error) {
    log.error("Received error");
    log.error(error);
    self.waitAndReconnect();
  };

  this.waitAndReconnect = function () {
    log.info('Waiting for reconnect');
    if (!reconnectTimer) {
      //var delay = Math.round(Math.random() * (10 - 5) + 5);
      var delay = 10;
      log.info("Waiting " + delay + "s and then retrying...");
      reconnectTimer = setTimeout(function () {
        log.info("Attempting to reconnect...");
        reconnectTimer = undefined;
        self.start();
      }, delay * 1000);
    }
  };
}

_util2['default'].inherits(NoysiClient, _events.EventEmitter);

exports['default'] = NoysiClient;
module.exports = exports['default'];
