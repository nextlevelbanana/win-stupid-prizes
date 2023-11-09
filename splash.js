class Splash extends Phaser.Scene {
    constructor() {
        super("Splash")
    }

    preload() {
        this.load.image("splash", "assets/SSJ2019_logolarge.png");

        this.load.image('bg', 'assets/stupidPrizesBG-LG.png');
        this.load.image('p1', 'assets/influencer1.png');
        this.load.image('p2', 'assets/influencer2.png');

        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
       
        this.load.image('heart', 'assets/WSP-hearticle.png');
        this.load.image('share', 'assets/WSP-sharicle.png');

        this.load.image('alert', 'assets/alert.png');
        this.load.image("follower-lg", "assets/icons/follower-lg.png");

        this.load.image("hate", "assets/icons/hate.png");

        this.load.text("tagList", "assets/names.txt");
        this.load.text("nameList", "assets/nameList.txt");
        this.load.text("firstNames", "assets/nameListA.txt");
    }

    create() {
        let scene = this;
        var sprt = this.add.image(CENTER_X,CENTER_Y *2 ,"splash");
        this.tweens.add({
            targets: [sprt],
            y: CENTER_Y,
            duration: 1000,
            repeat: 0,
            completeDelay:1500,
            onComplete(){
                scene.scene.start("Title");
            }
        });
       
    }
}
