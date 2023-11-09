class Name {
    constructor() {
        this.maxLength = 25;
    }
    static getName(player) {

        let lN = game.cache.text.get('nameList').split("\n");
        let fN = game.cache.text.get("firstNames").split("\n");
        let A = fN[Math.floor(Math.random()*fN.length)];
        let B = lN[Math.floor(Math.random()*lN.length)];

        return "@" + A + B;
    }

    static changeTags() {
        let data = game.cache.text.get('tagList').split("\n");
        let name = "#" + data[Math.floor(Math.random()*data.length)];
        let tag2 = "#" + data[Math.floor(Math.random()*data.length)];
       
        if ((name + " " + tag2).length < 26) {
            return name + " " + tag2;
        } else {
            return name;
        }
    }
}