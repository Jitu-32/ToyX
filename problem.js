
class ProblemStatement{
    
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
        let line = ""
        for(let i in words){
            line += words[i] + "\n";
        }
        this.desc = line;
        // console.log("words:", words, "line: "+line, "\n:[",this.desc,"]");
    }

}

ProblemStatement.WORD_TYPE = "word";
ProblemStatement.PICTURE_TYPE = "picture";
ProblemStatement.GUESS_TYPE = "guess";

ProblemStatement.getTestProblemStatement = function(){
    const ps = new ProblemStatement(ProblemStatement.WORD_TYPE, "Draw doodle for these words:");
    ps.addKeyWords(["ice", "cream", "heam-cream"]);
    return ps;
}

module.exports = {
    ProblemStatement
}