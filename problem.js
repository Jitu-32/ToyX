class ProblemStatement{
    static WORD_TYPE = "word";
    static PICTURE_TYPE = "picture";
    static GUESS_TYPE = "guess";
    
    constructor(type, heading){
        this.type = type;
        this.heading = heading;
    }

    addImage(imageUrl){
        this.imageUrl = imageUrl;
    }

    addDescription(text){
        this.desc = text;
    }

    addKeyWords(words){
        words = []
        line = ""
        for(w in words){
            line += w + "\n";
        }
        this.desc = line;
    }

}

var ps = new ProblemStatement(ProblemStatement.WORD_TYPE, "Guess the doodle for these words:");
ps.addKeyWords(["word1","word2"]);

switch(ps.type){
    case ProblemStatement.GUESS_TYPE:
        break;
    case ProblemStatement.GUESS_TYPE:
        break;
}


/*

timer code

var myVar = setInterval(func_name, 1000);
var t=0;
function func_name() {
  t++;
  document.getElementById("element-to-get").innerHTML = t;
  if(t==10){
    // any function
    clearInterval(myVar);
  }
  
  //if(t===60) break;
}

// executive a function after a certain time

function sayHi() {
  alert('Hello Mr. Universe!');
}

let myGreeting = setTimeout(sayHi, 2000);




// randomly shuffling

function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
// function hostNextRound(data) {
//     if(data.round < wordPool.length ){
//         // Send a new set of words back to the host and players.
//         sendWord(data.round, data.gameId);
//     } else {
//         // If the current round exceeds the number of words, send the 'gameOver' event.
//         io.sockets.in(data.gameId).emit('gameOver',data);
//     }
// }
// /* *****************************
//    *                           *
//    *     PLAYER FUNCTIONS      *
//    *                           *
//    ***************************** */

// /**
//  * A player clicked the 'START GAME' button.
//  * Attempt to connect them to the room that matches
//  * the gameId entered by the player.
//  * @param data Contains data entered via player's input - playerName and gameId.
//  */
// function playerJoinGame(data) {
//     //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

//     // A reference to the player's Socket.IO socket object
//     var sock = this;

//     // Look up the room ID in the Socket.IO manager object.
//     var room = gameSocket.manager.rooms["/" + data.gameId];

//     // If the room exists...
//     if( room != undefined ){
//         // attach the socket id to the data object.
//         data.mySocketId = sock.id;

//         // Join the room
//         sock.join(data.gameId);

//         //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

//         // Emit an event notifying the clients that the player has joined the room.
//         io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

//     } else {
//         // Otherwise, send an error message back to the player.
//         this.emit('error',{message: "This room does not exist."} );
//     }
// }

// /**
//  * A player has tapped a word in the word list.
//  * @param data gameId
//  */
// function playerAnswer(data) {
//     // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

//     // The player's answer is attached to the data object.  \
//     // Emit an event with the answer so it can be checked by the 'Host'
//     io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
// }

// /**
//  * The game is over, and a player has clicked a button to restart the game.
//  * @param data
//  */
// function playerRestart(data) {
//     // console.log('Player: ' + data.playerName + ' ready for new game.');

//     // Emit the player's data back to the clients in the game room.
//     data.playerId = this.id;
//     io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
// }

// /* *************************
//    *                       *
//    *      GAME LOGIC       *
//    *                       *
//    ************************* */

// /**
//  * Get a word for the host, and a list of words for the player.
//  *
//  * @param wordPoolIndex
//  * @param gameId The room identifier
//  */
// function sendWord(wordPoolIndex, gameId) {
//     var data = getWordData(wordPoolIndex);
//     io.sockets.in(gameId).emit('newWordData', data);
// }

// /**
//  * This function does all the work of getting a new words from the pile
//  * and organizing the data to be sent back to the clients.
//  *
//  * @param i The index of the wordPool.
//  * @returns {{round: *, word: *, answer: *, list: Array}}
//  */
// function getWordData(i){
//     // Randomize the order of the available words.
//     // The first element in the randomized array will be displayed on the host screen.
//     // The second element will be hidden in a list of decoys as the correct answer
//     var words = shuffle(wordPool[i].words);

//     // Package the words into a single object.
//     var wordData = {
//         round: i,
//         word : words[0],   // Displayed Word
        
//     };

//     return wordData;
// }

// /*
//  * Javascript implementation of Fisher-Yates shuffle algorithm
//  * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
//  */
// function shuffle(array) {
//     var currentIndex = array.length;
//     var temporaryValue;
//     var randomIndex;

//     // While there remain elements to shuffle...
//     while (0 !== currentIndex) {

//         // Pick a remaining element...
//         randomIndex = Math.floor(Math.random() * currentIndex);
//         currentIndex -= 1;

//         // And swap it with the current element.
//         temporaryValue = array[currentIndex];
//         array[currentIndex] = array[randomIndex];
//         array[randomIndex] = temporaryValue;
//     }

//     return array;
// }

// /**
//  * Each element in the array provides data for a single round in the game.
//  *
//  * In each round, two random "words" are chosen as the host word and the correct answer.
//  * Five random "decoys" are chosen to make up the list displayed to the player.
//  * The correct answer is randomly inserted into the list of chosen decoys.
//  *
//  * @type {Array}
//  */
// var wordPool = [
//     {
//         "words"  : [ "sale","seal","ales","leas" ],
//         "decoys" : [ "lead","lamp","seed","eels","lean","cels","lyse","sloe","tels","self" ]
//     },

//     {
//         "words"  : [ "item","time","mite","emit" ],
//         "decoys" : [ "neat","team","omit","tame","mate","idem","mile","lime","tire","exit" ]
//     },

//     {
//         "words"  : [ "spat","past","pats","taps" ],
//         "decoys" : [ "pots","laps","step","lets","pint","atop","tapa","rapt","swap","yaps" ]
//     },

//     {
//         "words"  : [ "nest","sent","nets","tens" ],
//         "decoys" : [ "tend","went","lent","teen","neat","ante","tone","newt","vent","elan" ]
//     },

//     {
//         "words"  : [ "pale","leap","plea","peal" ],
//         "decoys" : [ "sale","pail","play","lips","slip","pile","pleb","pled","help","lope" ]
//     },

//     {
//         "words"  : [ "races","cares","scare","acres" ],
//         "decoys" : [ "crass","scary","seeds","score","screw","cager","clear","recap","trace","cadre" ]
//     },

//     {
//         "words"  : [ "bowel","elbow","below","beowl" ],
//         "decoys" : [ "bowed","bower","robed","probe","roble","bowls","blows","brawl","bylaw","ebola" ]
//     },

//     {
//         "words"  : [ "dates","stead","sated","adset" ],
//         "decoys" : [ "seats","diety","seeds","today","sited","dotes","tides","duets","deist","diets" ]
//     },

//     {
//         "words"  : [ "spear","parse","reaps","pares" ],
//         "decoys" : [ "ramps","tarps","strep","spore","repos","peris","strap","perms","ropes","super" ]
//     },

//     {
//         "words"  : [ "stone","tones","steno","onset" ],
//         "decoys" : [ "snout","tongs","stent","tense","terns","santo","stony","toons","snort","stint" ]
//     }
// ]











*/