
class ProblemStatement {

    constructor(type, title) {
        this.type = type;
        this.title = title;
    }

    addImage(imageUrl) {
        this.imageUrl = imageUrl;
    }

    addDescription(text) {
        this.desc = text;
    }

    addKeyWords(words) {
        let line = ""
        for (let i in words) {
            line += words[i] + "\n";
        }
        this.desc = line;
        // console.log("words:", words, "line: "+line, "\n:[",this.desc,"]");
    }

}

ProblemStatement.WORD_TYPE = "word";
ProblemStatement.PICTURE_TYPE = "picture";
ProblemStatement.GUESS_TYPE = "guess";

ProblemStatement.getTestProblemStatement = function (gameType) {
    switch (gameType) {
        case ProblemStatement.WORD_TYPE:
            {
                const ps = new ProblemStatement(ProblemStatement.WORD_TYPE, "Draw doodle for these words:");
                ps.addKeyWords(["ice", "cream", "heam-cream"]);
                ps.addDescription("some description for gameType: " + gameType)
                return ps;
            }
        case ProblemStatement.PICTURE_TYPE:
            {
                const ps = new ProblemStatement(ProblemStatement.PICTURE_TYPE, "Draw doodle for this picture:");
                ps.addImage("https://qph.fs.quoracdn.net/main-qimg-6dc92898d750cee485b902cc0f9a3b23.webp")
                ps.addDescription("some description for gameType: " + gameType)
                return ps;
            }

        default:
            throw new Error("No test problem for gameType:" + gameType)
            return null;
    }

}

module.exports = {
    ProblemStatement
}