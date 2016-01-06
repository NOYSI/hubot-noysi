# Hubot dependencies
try
  {JoinTeamMessage,Robot,Adapter,EnterMessage,LeaveMessage,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {JoinTeamMessage,Robot,Adapter,EnterMessage,LeaveMessage,TextMessage,User} = prequire 'hubot'

#{NoysiBotListener} = require './listener'
#{JoinTeamMessage} = require './message'

NoysiClient = require './client'

class NoysiAdapter extends Adapter

  constructor: ->
    super

  send: (envelope, strings...) ->
    console.log strings
    for msg in strings
      msg.replace(/</g,'&lt;').replace(/>/g,'&gt;')
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
      token: process.env.NOYSI_TOKEN

    @options = options

    @loadScripts = true

    @robot.name = 'noysi'

    @client = new NoysiClient options.token

    @client.on 'open', @.open
    @client.on 'message', @.message

    @client.init(process.env.NOYSI_HOSTNAME or "noysi.com")

  open: =>
    @robot.logger.info 'Noysi client now connected'
    if (@loadScripts)
      @emit "connected"
      @loadScripts = false

  message: (msg) =>
    #@robot.logger.info 'Type: ' + msg.type + ' User: ' + msg.uid + ' Text: ' + msg.text
    # @robot.logger.info msg
    # Msg.types => message, channel_joined, team_joined, member_deleted, channel_opened, channel_deleted
    #if msg.type is 'team_joined'
    if msg.type is 'tour_completed'
      @robot.logger.info msg
      user = @robot.brain.userForId msg.uid
      user.tid = msg.tid
      @receive new EnterMessage user
    #else if msg.type is 'message' and /^noysi:([^\s]+).*joined/i.test(msg.text)
    #  @robot.logger.info msg.uid + ' Joined ' + msg.cid
    #  user = @robot.brain.userForId msg.uid
    #  user.tid = msg.tid
    #  user.room = msg.cid
    #  @receive new EnterMessage user, msg.type, msg.ts
    else if msg.type is 'message' and /^noysi:([^\s]+).*left/i.test(msg.text)
      #@robot.logger.info msg.uid + ' left ' + msg.cid
      user = @robot.brain.userForId msg.uid
      user.room = msg.cid
      @receive new LeaveMessage user, msg.type, msg.ts
    else if msg.type is 'message'
      @robot.logger.info msg
      user = @robot.brain.userForId msg.uid
      user.tid = msg.tid
      user.room = msg.cid
      @receive new TextMessage user, msg.text, msg.ts
    #else if msg.type == ''
    # else
    #  @robot.logger.info msg.type
    #  user = @robot.brain.userForId "noysi:robot"
    #  user.tid = msg.tid
    #  user.room = msg.cid
    #  @receive new TextMessage user, msg.type, msg.ts

exports.use = (robot) ->
  new NoysiAdapter robot
