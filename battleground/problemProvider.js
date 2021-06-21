const ProblemStatement = require('../models/battleground/problem').ProblemStatement

const csv = require('csv-parser')
const fs = require('fs')

const allWordProblems = [];
const wordTitle = "Draw doodle for these words:";

const allPictureProblems = [];
const pictureTitle = "Draw doodle for this Picture:";

// expected headers = ["id", "words", "desc", "imageUrl", "moreInfoLink"]
fs.createReadStream('battleground/problemData.csv') // path should be relative to server.js!
    .pipe(csv())
    .on('data', (data) => {
        // console.log(data)

        let id = data['id'];
        let words = data['words'];
        let desc = data['desc'];
        let imageUrl = data['imageUrl'];
        let moreInfoLink = data['moreInfoLink'];

        allWordProblems.push(new ProblemStatement(
            ProblemStatement.WORD_TYPE,
            id,
            wordTitle,
            words,
            desc,
            imageUrl,
            moreInfoLink));

        allPictureProblems.push(new ProblemStatement(
            ProblemStatement.PICTURE_TYPE,
            id,
            pictureTitle,
            words,
            desc,
            imageUrl,
            moreInfoLink));
    })


function getRandomWordProblem() {
    let high = allWordProblems.length;
    let low = 0;
    let randI = Math.floor(Math.random() * (high - low) + low);
    return allWordProblems[randI];
}

function getRandomPictureProblem() {
    let high = allPictureProblems.length;
    let low = 0;
    let randI = Math.floor(Math.random() * (high - low) + low);
    return allPictureProblems[randI];
}

module.exports = Object.freeze({
    ProblemProvider: {
        getRandomWordProblem: getRandomWordProblem,
        getRandomPictureProblem: getRandomPictureProblem
    }
})