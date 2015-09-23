'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

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

  var i = 0;

  var log = new _log2['default']('debug');

  var self = this;

  var pongTimeout = undefined;
  var lastPong = undefined;

  var reconnectTimer = undefined;

  this.start = function () {

    var options = {
      hostname: 'localhost',
      port: 9000,
      method: 'GET',
      path: '/api/rtm.start',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Length': 0
      }
    };

    var req = _http2['default'].request(options);

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

    req.end();
  };

  this.connect = function (url) {
    log.debug('connect ' + url);
    if (!url) {
      return false;
    } else var lastPong = Date.now();
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

    if (message.uid == 'noysi:robot') return;

    switch (message.type) {
      case "im_open":
        self.send({ 'type': 'message', translate: true, text: 'Hi again, I´m Noysi.  Nice to meet you. If you want more information about me, please write: noysi help', cid: message.channel.id });
        break;
      case "pong":
        if (lastPong && Date.now() - lastPong > 30000)
          //log.error("Last pong is too old: %d", (Date.now() - @_lastPong) / 1000)
          self.disconnect();else lastPong = Date.now();
        break;
      case "hello":
        connected = true;
        self.emit('open');
        break;
      case "message":
        self.emit('message', message);
    }
  };

  this.send = function (message) {
    if (!connected) {
      return false;
    } else {
      message.id = ++i;
      ws.send(JSON.stringify(message));
      return message;
    }
  };

  this.onError = function (error) {
    log.error("Received error");
    if (error && error.stack) log.error(error);
    self.waitAndReconnect();
  };

  this.waitAndReconnect = function () {
    log.info('Waiting for reconnect');
    if (!reconnectTimer) {
      var delay = Math.round(Math.random() * (10 - 5) + 5);
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
