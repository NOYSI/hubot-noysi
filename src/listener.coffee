{Listener} = require 'hubot'
{JoinTeamMessage} = require './message'

class NoysiBotListener extends Listener
  # NoysiBotListener is a listener made for messages that don't have text
  # like team_joined or member_deleted
  #
  # robot - A robot instance
  # callback - A function triggered with the incoming message
  constructor: (@robot) ->

  # Public: Adds a Listener that triggers when a member joins the team
  #
  # callback - A Function that is called with a Response object.
  #
  # Returns nothing.
  teamj: (options, callback) ->
    @listen(
      ((msg) -> msg instanceof JoinTeamMessage)
      options
      callback
    )

module.exports = {
  NoysiBotListener
}
