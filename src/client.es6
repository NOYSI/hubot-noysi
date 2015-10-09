import util from 'util'
import https from 'https'
import querystring from 'querystring'
import WebSocket from 'ws'
import Log from 'log'
import {EventEmitter} from 'events'

function NoysiClient(token) {

  EventEmitter.call(this);

  var authenticated  = false;
  var connected      = false;
  var url            = null;
  var ws             = null;

  var i              = 0;

  var log = new Log('debug');

  var self = this;

  var pongTimeout    = undefined;
  var lastPong       = undefined;

  var reconnectTimer = undefined;

  var options

  this.init = function(hostname) {
    options = {
      hostname: hostname,
      method: 'PUT',
      path: '/v1/authorize',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type' : 'application/json',
        'Content-Length' : 0
      }
    }
    this.start();
  }

  this.start = function() {

    var req = https.request(options)

    req.on('response', (res) => {

      var buffer = '';

      res.on('data', (chunk) => {

        buffer += chunk;

      });

      res.on('end', () => {

        if(res.statusCode == 200) {
          var value = JSON.parse(buffer)
          authenticated = true
          self.connect(value.url)
        } else {
          self.onError({error : 'API response: '+res.statusCode})
          authenticated = false
        }

      });

    });

    req.on('error', (error) => {

      self.onError(error)

      //if callback? then callback({'ok': false, 'error': error.errno})
    })

    req.write('');
    req.end()

  }

  this.connect = function(url) {
    log.debug('connect ' + url)
    if(!url) {
      return false
    } else
      lastPong = Date.now()
      ws = new WebSocket(url)
      ws.on('open', () => {

        var ping = () => {
          if(!connected) return
          self.send({"type": "ping"})
        }

        pongTimeout = setInterval(ping, 5000);

      })

      ws.on('message', (data, flags) => {

        self.onMessage(JSON.parse(data))

      })

      ws.on('error', (error) => {
        self.onError(error)
      })

      ws.on('close', () => {
        connected = false
        url = null
        self.waitAndReconnect();
      })

      return true

  }

  this.disconnect = function() {

    log.debug("Disconnected")

    if(pongTimeout) {
      clearInterval(pongTimeout)
      pongTimeout = undefined;
    }
    if(connected) {
      ws.close();
    }

  }

  this.onMessage = function(message) {

    if(!message.type) {
      return
    }

    if (message.uid == 'noysi:robot') {
      return
    }

    try {

      switch(message.type) {
        case "pong":
          if (lastPong && Date.now() - lastPong > 30000)
            //log.error("Last pong is too old: %d", (Date.now() - @_lastPong) / 1000)
            self.disconnect()
          else
            lastPong = Date.now()
          break;
        case "hello":
          connected = true
          self.emit('open')
          break;
        default:
          self.emit('message', message)
      }

    } catch(e) {
      log.error(e)
    }

  }

  this.send = function(message) {
    if (!connected) {
      return false
    } else {
      message.id = ++i
      ws.send(JSON.stringify(message))
      return message
    }

  }

  this.onError = function(error) {
    log.error("Received error")
    log.error(error);
    self.waitAndReconnect()
  }

  this.waitAndReconnect = function() {
    log.info('Waiting for reconnect');
    if (!reconnectTimer) {
      //var delay = Math.round(Math.random() * (10 - 5) + 5);
      var delay = 10;
      log.info("Waiting "+delay+"s and then retrying...");
      reconnectTimer = setTimeout(() => {
         log.info("Attempting to reconnect...");
         reconnectTimer = undefined;
         self.start()
      }, delay * 1000)
    }
  }


}

util.inherits(NoysiClient, EventEmitter);

export default NoysiClient;
