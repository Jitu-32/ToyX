
// constants for battleground

const GAME_EVENTS = Object.freeze({
    SOCKET_EVENT_COMING: "coming",
    SOCKET_EVENT_DRAWING: "drawing",
    SOCKET_EVENT_CHAT_MSG: "chatMsg",
    SOCKET_EVENT_DISCONNECT: "disconnect",
    SOCKET_EVENT_SOLUTION: "solution",
    SOCKET_EVENT_VOTED_SOLUTION: "votedSolution",
    SOCKET_EVENT_IS_PLAYER_READY: "isPlayerReady",
})

module.exports = Object.freeze({
    GAME_EVENTS: GAME_EVENTS
})