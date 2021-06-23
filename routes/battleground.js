/*
    /battleground/enter takes to the login page for battleground
    /battleground is where the game is played
*/
const express = require('express');
const router = express.Router();
const ColoredLog = require('../utils/coloredlogger').ColoredLog
const RoomStaticUtils = require('../battleground/socketEventSetup').RoomStaticUtils
const ProblemProvider = require('../battleground/problemProvider').ProblemProvider

router.get('/enter', function (req, res) {

    res.render('battlegroundEntry', {
        visibility: 'hidden',
        msg: null
    });

});

router.post('/enter', function (req, res) {

    console.log("req.body = ", req.body);

    let roomname = req.body.roomname;
    let username = req.body.username;
    let theme = req.body.theme;
    let timeSeconds = req.body.timeSeconds;

    const joinedRoomname = RoomStaticUtils.getJoinedRoomname(username);
    console.log(ColoredLog.red("joinedRoomname: " + joinedRoomname + " by username: " + username + " with theme: " + theme + " timeSeconds: " + timeSeconds, true))

    if (!roomname || roomname.indexOf(' ') > -1 || roomname.length === 0) {
        res.send({
            visibility: 'visible',
            msg: 'Invalid Roomname'
        });

    } else if (!username || username.length === 0) {
        res.send({
            visibility: 'visible',
            msg: 'Invalid Username'
        });

    }  else if (!timeSeconds || timeSeconds.length === 0) {
        res.send({
            visibility: 'visible',
            msg: 'Invalid timeSeconds'
        });

    } else if (!theme || theme.length === 0 || !ProblemProvider.isThemeValid(theme)) {
        res.send({
            visibility: 'visible',
            msg: `Invalid theme [${theme}]; valid themes: ${ProblemProvider.getAllThemes()}`,
        });

    } else if (joinedRoomname) {
        let msg2ndLine = "Cannot join 2 rooms at once!"

        if (joinedRoomname === roomname) {
            msg2ndLine = "Cannot rejoin same room from different tabs!"
        }

        res.send({
            visibility: 'visible',
            msg: `User ${username} already in Room ${joinedRoomname}! \n${msg2ndLine}`
        });

    } else {
        // res.redirect(`/battleground?roomname=${roomname}&username=${username}`)

        // check if the room already has a gameType

        let roomGameType = RoomStaticUtils.getRoomGameType(roomname); // returns null if room doesn't exists!
        let roomTheme = RoomStaticUtils.getRoomTheme(roomname); // returns null if room doesn't exists!
        let roomTimeSeconds = RoomStaticUtils.getRoomTimeSeconds(roomname); // returns null if room doesn't exists!

        if (!roomGameType) {
            // redirect to the same url without gameType
            //  this will show UI to ask for `gametype`
            res.redirect(`/battleground/enter?roomname=${roomname}&username=${username}&theme=${theme}&timeSeconds=${timeSeconds}`)

        } else {
            // no need to ask for roomGameType, directly forward to battleground
            res.redirect(`/battleground?roomname=${roomname}&username=${username}&gameType=${roomGameType}&theme=${roomTheme}&timeSeconds=${roomTimeSeconds}`)
        }
    }

});


router.get('/', function (req, res) {
    let username = req.query.username
    let roomname = req.query.roomname

    if (!username || !roomname) {
        res.redirect("/battleground/enter")
        return;
    }

    res.render('battleground', {
        roomname: roomname,
        username: username
    });
});


// Exports

module.exports = router
