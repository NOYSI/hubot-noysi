{Message, TextMessage} = require 'hubot'

class ControlMessage
  # Represents a noysi control message
  #
  # user - A User instance that triggers the message.
  constructor: (@user, @done = false) ->
    @team = @user.team

  # Indicates that no other Listener should be called on this object
  #
  # Returns nothing.
  finish: ->
    @done = true

# Represents an incoming user joining a team
#
# user - A User instance for the user who entered.
# id   - A String of the message ID.
class JoinTeamMessage extends ControlMessage

module.exports = {
  JoinTeamMessage
}
