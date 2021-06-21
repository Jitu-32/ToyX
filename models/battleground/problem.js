
class ProblemStatement {

    constructor(type, id, title, words, desc, imageUrl, moreInfoLink) {
        this.type = type;
        this.id = id;
        this.title = title;
        this.words = words;
        this.desc = desc;
        this.imageUrl = imageUrl;
        this.moreInfoLink = moreInfoLink;
    }

}

ProblemStatement.WORD_TYPE = "word";
ProblemStatement.PICTURE_TYPE = "picture";
ProblemStatement.GUESS_TYPE = "guess";

module.exports = {
    ProblemStatement
}