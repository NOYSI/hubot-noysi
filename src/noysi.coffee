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
        tid : envelope.user.tid,
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
      token: process.env.NOYSI_TOKEN or "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdXRoOnVpZCI6Im5veXNpOnJvYm90IiwicGVybWlzc2lvbnMiOm51bGwsImlhdCI6MTQ0NDM2OTU1OX0=.TUN9WdYTSjdkOGXsM_OIG84Nm7I1QnFszYPW3VSgjY0="

    @options = options

    @loadScripts = true

    @robot.name = 'noysi'

    @client = new NoysiClient options.token

    @client.on 'open', @.open
    @client.on 'message', @.message

    @client.init(process.env.NOYSI_HOSTNAME or "dev.noysi.com")

  open: =>
    @robot.logger.info 'Noysi client now connected'
    if (@loadScripts)
      @emit "connected"
      @loadScripts = false

  message: (msg) =>

    if msg.type == 'message'
      user = @robot.brain.userForId msg.uid
      user.tid = msg.tid
      user.room = msg.cid
      @receive new TextMessage user, msg.text, msg.ts
    else
      @robot.logger.info msg.type
      user = @robot.brain.userForId "noysi:robot"
      user.tid = msg.tid
      user.room = msg.cid
      @receive new TextMessage user, msg.type, msg.ts

exports.use = (robot) ->
  new NoysiAdapter robot
