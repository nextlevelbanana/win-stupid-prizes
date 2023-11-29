const RXN_TIME = 200;

class MainScene extends Phaser.Scene {
    constructor() {
        super("Main");
        this.p1;
        this.p2;
    }

    preload () {
        this.load.image('bg', 'assets/stupidPrizesBG.png');
        this.load.image('p1', 'assets/influencer1.png');
        this.load.image('p2', 'assets/influencer2.png');
        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
       
        this.load.image('heart', 'assets/WSP-hearticle.png');
        this.load.image('share', 'assets/WSP-sharicle.png');

        this.load.image('alert', 'assets/alert.png');

        this.load.image("hate", "assets/icons/hate.png")
    }

    create () {
        let scene = this; 
        this.input.enabled = false;
        this.add.image(400, 300, 'bg');
        this.add.image(53, 400, 'p1');
        this.add.image(453, 400, 'p2');
        this.createUpgrades();
        this.createCharacters();
        this.registry.set("cooldown",0);

        this.add.bitmapText(100, 420, 'type-y', this.p1.name, 32);
        this.add.bitmapText(500, 420, 'type-y', this.p2.name, 32);
        this.p1.scoreText = this.add.bitmapText(50, 500, 'type-y', this.formatFollowerString(this.p1), this.getFontSize(this.p1.count));
        this.p2.scoreText = this.add.bitmapText(450, 500, 'type-y', this.formatFollowerString(this.p2), this.getFontSize(this.p2.count));

        this.p1.rateText = this.add.bitmapText(50, 540, 'type-y', this.formatRateString(this.p1), 32);
        this.p2.rateText = this.add.bitmapText(450, 540, 'type-y', this.formatRateString(this.p2), 32);
    
        this.time.delayedCall(300, () => {this.input.enabled = true;},null,this);

        this.p1.hateSprite = this.add.image(200,300,"hate").setScale(10);
        this.p1.hateSprite.visible = false;
        this.p2.hateSprite = this.add.image(600,300,"hate").setScale(10);
        this.p2.hateSprite.visible = false;

        this.cursors = this.input.keyboard.createCursorKeys();   
        let lastLTimeStamp = 0;
        let lastRTimeStamp = 0;
        let lastDTimeStamp = 0;

        this.input.keyboard.on("keyup", function(ev){
            let leftEv = scene.cursors.left.originalEvent;
            let rightEv = scene.cursors.right.originalEvent;

            //If DOWN just released,
            if (ev.key == "ArrowDown") {
                if (ev.timeStamp <= lastDTimeStamp) return;
                lastDTimeStamp = ev.timeStamp;
                //and no other key pressed ever/lately? return.
                if (!leftEv || leftEv.timeStamp + RXN_TIME < ev.timeStamp) {
                    if (!rightEv || rightEv.timeStamp + RXN_TIME < ev.timeStamp) {
                            scene.cursors.down.reset();
                            return;
                    } 
                }
                //--------------------------------------------

                //and LEFT just released? 
                if (leftEv && leftEv.type == "keyup" && leftEv.timeStamp + RXN_TIME > ev.timeStamp){
                    //If right not released, or not lately, fire left menu
                    if (!rightEv || rightEv.type != "keyup" || rightEv.timeStamp + RXN_TIME < ev.timeStamp) {
                        lastLTimeStamp = leftEv.timeStamp;
                        scene.startMenu("p1"); 
                        return;
                    } else {
                        //but if right fired recently, menu the most recent fire and click the loser
                        let winner = leftEv.timeStamp > rightEv.timeStamp ? scene.p1: scene.p2;
                        scene.click(winner == scene.p1 ? scene.p2:scene.p1);

                        //don't process the "click"
                        if (winner == scene.p1) {
                            lastLTimeStamp = leftEv.timeStamp;
                        } else {
                            lastRTimeStamp = rightEv.timeStamp;
                        }

                        scene.startMenu(winner == scene.p1 ? "p1":"p2");
                        return;
                    }
                }

                //and RIGHT just released? Mirror above.
                if (rightEv && rightEv.type == "keyup" && rightEv.timeStamp + RXN_TIME > ev.timeStamp){
                    if (!leftEv || leftEv.type != "keyup" || leftEv.timeStamp + RXN_TIME < ev.timeStamp) {
                        lastRTimeStamp = rightEv.timeStamp;
                        scene.startMenu("p2"); 
                        return;
                    } else {
                        let winner = leftEv.timeStamp > rightEv.timeStamp ? scene.p1: scene.p2;
                        scene.click(winner == scene.p1 ? scene.p2:scene.p1);

                        //don't process the "click"?
                        if (winner == scene.p1) {
                            lastLTimeStamp = leftEv.timeStamp || 0;
                        } else {
                            lastRTimeStamp = rightEv.timeStamp || 0;
                        }

                        scene.startMenu(winner == scene.p1 ? "p1":"p2");
                        return;
                    }
                }

                //What if no key just released, but one or both has been pressed? 
                //I hate this.
                //if left down, but no right/lately, menu p1
                if (leftEv && leftEv.type == "keydown") {
                    if (!rightEv || rightEv.type != "keydown" || rightEv.timeStamp + RXN_TIME < ev.timeStamp) {
                        lastLTimeStamp = leftEv.timeStamp;
                        scene.startMenu("p1");
                        return;
                    } else {
                        //fire menu for player whose keydown is closer to menudown,
                        //and ignore the other click
                        var targetTime = scene.cursors.down.timeDown;
                        var leftGap = Math.abs(scene.cursors.left.timeDown - targetTime);
                        var rightGap = Math.abs(scene.cursors.right.timeDown - targetTime);
                        let winner = leftGap < rightGap? scene.p1:scene.p2;

                        if (winner == scene.p1) {
                            lastLTimeStamp = leftEv.timeStamp || 0;
                        } else {
                            lastRTimeStamp = rightEv.timeStamp || 0;
                        }

                        scene.startMenu(winner == scene.p1 ? "p1":"p2");
                        return;
                    }
                }

                //if right down, mirror above
                if (rightEv && rightEv.type == "keydown") {
                    if (!leftEv || leftEv.type != "keydown" || leftEv.timeStamp + RXN_TIME < ev.timeStamp) {
                        lastRTimeStamp = rightEv.timeStamp;
                        scene.startMenu("p2");
                        return;
                    } else {
                        var targetTime = scene.cursors.down.timeDown;
                        var leftGap = Math.abs(scene.cursors.left.timeDown - targetTime);
                        var rightGap = Math.abs(scene.cursors.right.timeDown - targetTime);
                        let winner = leftGap < rightGap? "p1":"p2";

                        if (winner == scene.p1) {
                            lastLTimeStamp = leftEv.timeStamp || 0;
                        } else {
                            lastRTimeStamp = rightEv.timeStamp || 0;
                        }

                        scene.startMenu(winner);
                        return;
                    }
                }
            } //end dealing with DOWN keyup
            else {
                if (scene.cursors.down.originalEvent && (scene.cursors.down.originalEvent.timeStamp == ev.timeStamp || scene.cursors.down.isDown)) {
                //what if DOWN is down and ABOUT to be released??
                    var targetTime = scene.cursors.down.timeDown;
                    var leftGap = Math.abs(scene.cursors.left.timeDown - targetTime);
                    var rightGap = Math.abs(scene.cursors.right.timeDown - targetTime);
                    let winner = leftGap < rightGap? "p1":"p2";

                    if (winner == scene.p1) {
                        lastLTimeStamp = leftEv? leftEv.timeStamp : 0;
                    } else {
                        lastRTimeStamp = rightEv? rightEv.timeStamp : 0;
                    }

                    scene.startMenu(winner);
                } else {
                    if (ev.key == "ArrowLeft") {
                        if (ev.timeStamp <= lastLTimeStamp) return;
                        lastLTimeStamp = ev.timeStamp;
                        scene.click(scene.p1, scene);
                        return;
                    }
                    if (ev.key == "ArrowRight") {
                        if (ev.timeStamp <= lastRTimeStamp) return;
                        lastRTimeStamp = ev.timeStamp;
                        scene.click(scene.p2, scene);
                        return;
                    }
                }
            } 

        });

        this.events.addListener('resume', function(){
            let p = scene.registry.get("hatedPlayer");
            if (p) {
                if (p == "p1") {
                    scene.p1.timeHated += 5000;
                } else {
                    scene.p2.timeHated += 5000;
                }
            }
            scene.input.enabled = true;
            scene.music.volume = 1;
            scene.drawUpgrades(scene.p1);
            scene.drawUpgrades(scene.p2);
        });

        this.createParticles();
    }

    update(time,delta) {

        if (this.p1.timeHated > 0) {
            this.p1.timeHated -= delta;
            this.p1.hateSprite.visible = true;
        } else {
            this.p1.timeHated = 0;
            this.p1.hateSprite.visible = false;
            this.p1.count += (this.p1.rate/1000) * delta;
        }
        if (this.p2.timeHated > 0) {
            this.p2.timeHated -= delta;
            this.p2.hateSprite.visible = true;
        } else {
            this.p2.timeHated = 0;
            this.p2.hateSprite.visible = false;
            this.p2.count += (this.p2.rate/1000) * delta;
        }

        this.alertUpgradeAvailable();
        this.checkGameOver();

        this.p1.scoreText.setText(this.formatFollowerString(this.p1));
        this.p2.scoreText.setText(this.formatFollowerString(this.p2));
        this.p1.rateText.setText(this.formatRateString(this.p1));
        this.p2.rateText.setText(this.formatRateString(this.p2));
    }

    startMenu(player) {
        this.input.enabled = false;
        this.registry.set("p1", this.p1);
        this.registry.set("p2", this.p2);
        this.registry.set("active",player);
        this.cursors.down.reset();
        this.cursors.right.reset();
        this.cursors.left.reset();
        this.music.volume = 0.2;
        this.scene.pause('Main');
        this.scene.run("Menu");
    }

    formatFollowerString(player) {
        let numstr = Math.floor(player.count).toLocaleString("en-us") + " followers";
        let maxChars = player.count > Math.pow(10,12) ? 23 : 18
        return numstr.substring(0,maxChars);
    }

    formatRateString(player) {
        if (player.timeHated > 0) {
            return "pile on for " + (player.timeHated / 1000).toFixed(1) + " sec";
        }
        let numstr = "+" + player.rate.toFixed(1) + " f/sec";
        let maxChars = player.rate > Math.pow(10,10) ? 23 : 18
        return numstr.substring(0,maxChars);
    }

    getFontSize(count) {
        if(count > Math.pow(10,12)) {
            return 24
        }
        return 32
    }

    createCharacters() {
        this.p1 = {}
        this.p2 = {}
        this.p1.count = 0;
        this.p2.count = 0;

        this.p1.name = "Ashley";
        this.p2.name = "Sarah";

        this.p1.rate = 0;
        this.p2.rate = 0;

        this.p1.upgrades = {};
        this.p2.upgrades = {};
        this.p1.nextAt = 15;
        this.p2.nextAt = 15;

        this.p1.timesHated= 0;
        this.p2.timesHated = 0;

        this.p1.alert = this.add.sprite(320,450,"alert")
        this.p2.alert = this.add.sprite(720,450,"alert")

        this.registry.set("p1", this.p1)
        this.registry.set("p2", this.p2)
    }

    click(player,scene) {
        player.count += 1;
        if (player == scene.p1) {
            scene.emitter1.explode(Math.floor(Math.random()*3)+1,53,400)
            scene.emitter1b.explode(Math.floor(Math.random()*3)+1,53,400)
        } else {
            scene.emitter2.explode(Math.floor(Math.random()*3)+1,453,400)
            scene.emitter2b.explode(Math.floor(Math.random()*3)+1,453,400)
        }
    }

    alertUpgradeAvailable() {
        if (this.p1.count >= this.p1.nextAt) {
            this.p1.alert.visible = true;
            this.p1alerter.start();
        } else {
            this.p1.alert.visible = false;
            this.p1alerter.stop();

        }
        if (this.p2.count >= this.p2.nextAt) {
            this.p2.alert.visible = true;
            this.p2alerter.start();

        } else {
            this.p2.alert.visible = false;
            this.p2alerter.stop();

        }
    }

    createParticles(){
        let scene = this;
        var particles = this.add.particles('heart');
        var part2 = this.add.particles('share');

        var e1config = {
            speed: 100,
            scale: { start: .2, end: 1 },
            on: false,
            tint: 0xff7930,
            lifespan: 550
        }

        var e2config = {
            speed: 100,
            scale: { start: .2, end: 1 },
            on: false,
            tint: 0x4184fb,
            lifespan: 550
        }

        this.emitter2 = particles.createEmitter(e2config);

        this.emitter1 = particles.createEmitter(e1config);
        this.emitter1b = part2.createEmitter(e1config);
        this.emitter2b = part2.createEmitter(e2config);

        var alerticles = this.add.particles('alert');
        this.p1alerter = alerticles.createEmitter({
            deathZone: {
                type: 'onEnter',
                source: new Phaser.Geom.Rectangle(scene.p1.alert.x-40,scene.p1.alert.y-12,100,100)
            },
            speed: 80,scale:{start:0.2,end:0.5}, lifespan:600})
        this.p1alerter.startFollow(this.p1.alert,0,-13);
        this.p1alerter.stop();
        this.p2alerter = alerticles.createEmitter({deathZone: {
            type: 'onEnter',
            source: new Phaser.Geom.Rectangle(scene.p2.alert.x-40,scene.p2.alert.y-12,100,100)
        },speed: 80,scale:{start:0.2,end:0.5}, lifespan:600})
        this.p2alerter.startFollow(this.p2.alert,0,-13);
        this.p2alerter.stop();
    }

    createUpgrades() {
        let upgrades = {
            "scheduled": {
                name: "Scheduled Post",
                description: "influence on the reg",
                rate: 0.1,
                icon: "scheduled",
                cost: function(owned) {
                    return Math.floor(15 * Math.pow(1.12,owned))
                }
            },
            "sponsored": {
                name:"SponCon",
                description: "#ad #authentic #bestLife",
                rate: 0.5,
                icon: "question",
                cost: function(owned) {
                    return Math.floor(75 * Math.pow(1.15,owned))
                }
            },
            "research": {
                name: "Market Research",
                description: "know your #audience",
                rate: 4,
                cost: function(owned) {
                    return Math.floor(350 * Math.pow(1.1,owned))
                }        
            },
            "bots": {
                name: "Buy Bots",
                description: "Fake it till ya make it, bb",
                rate: 10,
                cost: function(owned) {
                    return Math.floor(2000* Math.pow(1.07,owned))
                }  
            },
            "giveaway": {
                name: "Giveaway",
                description: "Share for a chance to be #influenced",
                rate: 40,
                cost: function(owned){
                    return Math.floor(12000* Math.pow(1.11,owned))
                }
                
            },
            "youtube": {
                name: "YouTube Stunt",
                description: "It's only a terrible idea if no one's watching",
                rate: 100,
                cost: function(owned) {
                    return Math.floor(43434* Math.pow(1.09,owned))
                }
            },
            "apology": {
                name: "Apology Video",
                description: "ok maybe it WAS a terrible idea",
                rate: 400,
                cost: function(owned) {
                    return Math.floor(200000* Math.pow(1.07,owned))
                }
               
            },
           
            "interns": {
                name: "Unpaid Interns",
                description: "Posting for you is valuable experience",
                rate: 5000,
                cost: function(owned) {
                    return Math.floor(1675000* Math.pow(1.13,owned))
                }
            },
            
            "tv": {
                name: "Reality TV Show",
                description: "Deep down, we all knew it would come to this",
                rate: 66666,
                cost: function(owned){
                    return Math.floor(100000000* Math.pow(1.15,owned))
                }
            }

        }
        this.registry.set("upgrades", upgrades);
    }

    checkGameOver() {
        if (this.p1.count == Number.MAX_SAFE_INTEGER) {
            this.scene.stop();
            this.registry.set("winner", "p1");
            this.scene.start('GameOver');
        }

        if (this.p2.count == Number.MAX_SAFE_INTEGER) {
            this.scene.stop();
            this.registry.set("winner", "p2");
            this.scene.start('GameOver');
        }
    }

    drawUpgrades(player) {
        var drawn = 0;
        let upgrades = this.registry.get("upgrades");
        for(var key in upgrades) {
            if (player.upgrades[key]) {
                this.add.image(player == this.p1? 70:470,50+(40*drawn),key)
                if (!player.upgrades[key].displayText) {
                    player.upgrades[key].displayText = this.add.bitmapText(player == this.p1? 100:490,35+(40*drawn), "type-y","X " + player.upgrades[key].owned,32)
                    player.upgrades[key].rateText = this.add.bitmapText(player == this.p1? 200:590,40+(40*drawn), "type-y", "+" + (upgrades[key].rate * player.upgrades[key].owned).toFixed(1) + " f/sec", 16)
                } else {
                    player.upgrades[key].displayText.y = 35+(40*drawn)
                    player.upgrades[key].displayText.setText("X " + player.upgrades[key].owned);
                    player.upgrades[key].rateText.y = 40+(40*drawn)
                    player.upgrades[key].rateText.setText("+" + (upgrades[key].rate * player.upgrades[key].owned).toFixed(1) + " f/sec")
                }
                drawn++
            }
        }
    }
    
}

let config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Splash]
};

class Title extends Phaser.Scene {
    constructor() {
        super("Title")
    }

    preload() {
        this.load.image("title", "assets/title.png");
        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
    }

    create() {
        let scene = this;
        this.add.image(400,300,"title");
        this.add.bitmapText(270,350,"type-y", "(press any key)", 32)
        this.input.keyboard.on("keyup", function(){
            scene.scene.stop();
            scene.scene.start("Instructions");
        });
    }
}

class Instructions extends Phaser.Scene {
    constructor(){
        super("Instructions");
    }

    preload() {
        this.load.image("tut", "assets/tut.png");
    }

    create() {
        let scene = this;
        this.add.image(400,300,"tut");

        this.input.keyboard.on("keyup", function(){
            scene.scene.stop();
            scene.scene.start("Main");
        })
    }
}

let game = new Phaser.Game(config);
game.scene.add("Main", MainScene, false);
game.scene.add("Title", Title, false);
game.scene.add("Instructions", Instructions, false);