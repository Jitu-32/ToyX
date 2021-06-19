
const express = require('express');
const router = express.Router();


router.get('/', function (req, res) {

    res.render('battlegroundEntry', {
        visibility: 'hidden',
        msg: null
    });
});

router.post('/', function (req, res) {

    var roomname = req.body.roomname;
    var username = req.body.username;

    if (roomname.indexOf(' ') > -1 || roomname.length === 0) {
        res.render('battlegroundEntry', {
            visibility: 'visible',
            msg: 'Invalid Roomname'
        });
    } else {

        // everything okay, let's render game view
        res.render('battleground', {
            roomname: roomname,
            username: username
        });

    }

});



// Exports

module.exports = router
