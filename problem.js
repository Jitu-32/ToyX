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