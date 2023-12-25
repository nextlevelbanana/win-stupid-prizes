class GameOver extends Phaser.Scene {
    constructor() {
        super("GameOver");
    }

    preload(){
        this.load.image('p1', 'assets/influencer1.png');
        this.load.image('p2', 'assets/influencer2.png');
    }

    create() {
        this.input.enabled = false;

        this.winner = this.registry.get(this.registry.get("winner"));

        this.add.bitmapText(100,50,"type-y", "WINNER",144);
        this.add.bitmapText(200,180, "type-y", this.winner.name);
            
        var drawn = 0;
        let upgrades = this.registry.get("upgrades");
        for(var key in upgrades) {
                if (this.winner.upgrades[key]) {
                    this.add.image(200, 270 +((45)*drawn),key)

                     this.winner.upgrades[key].displayText = this.add.bitmapText(
                        250, 252+((47)*drawn), "type-y","X" + this.winner.upgrades[key].owned, 32)
                    drawn++
                }
            }

        this.add.bitmapText(1000,1080/3,"type-y", "Congratulations?", 48);

        this.add.image(140,210,this.registry.get("winner"))
        this.time.delayedCall(3000, this.startListening,null,this);

        this.input.keyboard.on("keyup", function(){
            if (this.input.enabled) {
                location.reload();
            }
        }, this);
    }

    startListening() {
        this.input.enabled = true;
        this.add.bitmapText(1000,1080/2,"type-y", "Press a key to play again!", 48);
    }
}
game.scene.add("GameOver", GameOver, false);
