# Hubot dependencies
try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

NoysiClient = require './client'

class NoysiAdapter extends Adapter

  constructor: ->
    super

  send: (envelope, strings...) ->
    # @robot.logger.info envelope.user
    for msg in strings
      @client.send({
        type : 'message',
        cid : envelope.user.room,
        text : msg
      })

  reply: (envelope, strings...) ->
    # @robot.logger.info "reply ..."
    for msg in strings
      @send envelope, msg

  run: ->
    # Take our options from the environment, and set otherwise suitable defaults
    options =
      token: process.env.HUBOT_NOYSI_TOKEN or "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoOnVpZCI6Im5veXNpOnJvYm90IiwidGVhbTppZCI6InQ1cWRpdnRiYSIsImlhdCI6MTQ0Mjk3NzM2MCwieHNmciI6InNlY3JldDAifQ==.3JMRGei7c4WL0lm_TuRR-bqN5V1wJRJ64vW-Hb4L9rY="

    @options = options

    @loadScripts = true

    @robot.name = 'noysi'

    @client = new NoysiClient options.token

    @client.on 'open', @.open
    @client.on 'message', @.message

    @client.start()

  open: =>
    @robot.logger.info 'Noysi client now connected'
    if (@loadScripts)
      @emit "connected"
      @loadScripts = false

  message: (msg) =>

    user = @robot.brain.userForId msg.uid
    user.room = msg.cid

    @receive new TextMessage user, msg.text, msg.ts

exports.use = (robot) ->
  new NoysiAdapter robot
