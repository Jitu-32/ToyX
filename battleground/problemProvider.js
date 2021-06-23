const ProblemStatement = require('../models/battleground/problem').ProblemStatement

const csv = require('csv-parser')
const fs = require('fs')

const allValidThemes = new Set();
allValidThemes.add("_random_"); // random theme support

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
        let theme = data['theme']
        let words = data['words'];
        let desc = data['desc'];
        let imageUrl = data['imageUrl'];
        let moreInfoLink = data['moreInfoLink'];

        allValidThemes.add(theme);

        allWordProblems.push(new ProblemStatement(
            ProblemStatement.WORD_TYPE,
            id,
            theme,
            wordTitle,
            words,
            desc,
            imageUrl,
            moreInfoLink));

        allPictureProblems.push(new ProblemStatement(
            ProblemStatement.PICTURE_TYPE,
            id,
            theme,
            pictureTitle,
            words,
            desc,
            imageUrl,
            moreInfoLink));
    })


function getRandomProblem(targetTheme, gameType) {
    let shortlistedProblems = [];
    let baseProblems;
    switch (gameType) {
        case "word":
            baseProblems = allWordProblems;
            break;

        case "picture":
            baseProblems = allPictureProblems;
            break;

        default:
            throw new Error("unknown gameType: " + gameType);
    }
    baseProblems.forEach(aProblem => {
        if (aProblem.theme === targetTheme || targetTheme === "_random_")
            shortlistedProblems.push(aProblem)
    });

    let high = shortlistedProblems.length-1;
    let low = 0;
    let randI = Math.floor(Math.random() * (high - low) + low);
    return shortlistedProblems[randI];
}

function isThemeValid(theme) {
    return allValidThemes.has(theme)
}

function getAllThemes() {
    return  [...allValidThemes];
}

module.exports = Object.freeze({
    ProblemProvider: {
        getRandomProblem: getRandomProblem,
        isThemeValid: isThemeValid,
        getAllThemes: getAllThemes
    }
})