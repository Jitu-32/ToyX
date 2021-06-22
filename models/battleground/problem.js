
class ProblemStatement {

    constructor(type, id, theme, title, words, desc, imageUrl, moreInfoLink) {
        this.type = type;
        this.id = id;
        this.theme = theme;
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