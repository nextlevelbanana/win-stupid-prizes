const WIDTH = 1920;
const HEIGHT = 1080;
const CENTER_X = 1920/2;
const CENTER_Y = 1080/2;
const STATUS_TOP = 1080/3*2;
const STATUS_L1_TOP = STATUS_TOP + 30;
const L_MARGIN = 120;
const P1_X = L_MARGIN + 30;
const MARGIN = 450;
const LINEHEIGHT = 50;
const BIGFONTSIZE = 48;
const SMALLFONTSIZE = 36;
const GAMEOVER = 100000;

class MainScene extends Phaser.Scene {
    constructor() {
        super("Main");
        this.p1;
        this.p2;
        this.p1Sprite;
        this.p2Sprite;
    }

    preload () {
        this.load.image("hate-lg", "assets/hate-lg.png")
    
        this.load.image("splash", "assets/SSJ2019_logolarge.png");

        this.load.image('bg', 'assets/stupidPrizesBG-HD.png');
        this.load.image('p1', 'assets/Red_Icon.png');
        this.load.image('p2', 'assets/Blue_Icon.png');

        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
        this.load.bitmapFont('type-b', 'assets/font/typewriter-blue.png', 'assets/font/typewriter-blue.fnt');
        this.load.bitmapFont('type-o', 'assets/font/typewriter-orange.png', 'assets/font/typewriter-orange.fnt');

       
        this.load.image('hearto', 'assets/heart-orange.png');
        this.load.image('heartb', 'assets/heart-blue.png');
        this.load.image('reposto', 'assets/sharicle-orange.png');
        this.load.image('repostb', 'assets/sharicle-blue.png');
        this.load.image('nodeo', 'assets/node-orange.png');
        this.load.image('nodeb', 'assets/node-blue.png');
        this.load.image('shareo', 'assets/share-arrow-orange.png');
        this.load.image('shareb', 'assets/share-arrow-blue.png');
        this.load.image('planeo', 'assets/plane-orange.png');
        this.load.image('planeb', 'assets/plane-blue.png');

        this.load.image('alert', 'assets/alert.png');
        this.load.image('p1menu', 'assets/orange-menu.png');
        this.load.image('p2menu', 'assets/blue-menu.png');

        this.load.image("follower-lg", "assets/icons/follower-lg.png");

        this.load.image("hate", "assets/icons/hate.png");

        this.load.text("tagList", "assets/names.txt");
        this.load.text("nameList", "assets/nameList.txt");
        this.load.text("firstNames", "assets/nameListA.txt");
    }
    
    create () {
        let scene = this; 
        this.input.enabled = false;
        this.add.image(CENTER_X, CENTER_Y, 'bg');
        this.p1Sprite = this.add.image(L_MARGIN, STATUS_TOP , 'p1');
        this.p2Sprite = this.add.image(WIDTH - L_MARGIN, STATUS_TOP, 'p2');
        this.createUpgrades();
        this.createCharacters();
        this.registry.set("cooldown",0);
        
        const p1StatusX = L_MARGIN;
        const p2StatusX = CENTER_X + L_MARGIN;
        
        const statusY = STATUS_L1_TOP + (LINEHEIGHT*1);
        const statusY2 = STATUS_L1_TOP + (LINEHEIGHT*2.5);

        this.add.bitmapText(p1StatusX, statusY, 'type-y', this.p1.name, BIGFONTSIZE);
        this.add.bitmapText(p2StatusX, statusY, 'type-y', this.p2.name, BIGFONTSIZE);
        this.add.image(p1StatusX + 20, statusY2, 'follower-lg');
        this.add.image(p2StatusX + 20, statusY2, 'follower-lg');
        
        this.p1.hashtags = this.physics.add.group();
        this.p2.hashtags = this.physics.add.group();
        this.wall = this.add.rectangle(CENTER_X + 2, 0, 4, 2200, 0xaa9200);
        this.physics.add.existing(this.wall, true);


        this.p1.scoreText = this.add.bitmapText(p1StatusX + 50, statusY2 - 15, 'type-y', this.formatFollowerString(this.p1), this.getFontSize(this.p1.count));
        this.p2.scoreText = this.add.bitmapText(p2StatusX + 50, statusY2 - 15, 'type-y', this.formatFollowerString(this.p2), this.getFontSize(this.p2.count));

        this.p1.rateText = this.add.bitmapText(p1StatusX, statusY2 + LINEHEIGHT, 'type-y', this.formatRateString(this.p1), BIGFONTSIZE);
        this.p2.rateText = this.add.bitmapText(p2StatusX, statusY2 + LINEHEIGHT, 'type-y', this.formatRateString(this.p2), BIGFONTSIZE);
    
        this.time.delayedCall(300, () => {this.input.enabled = true;},null,this);

        this.p1.hateSprite = this.add.image(456+30,50+456,"hate-lg");
        this.p1.hateSprite.setScale(1.75);
        this.p1.hateSprite.visible = false;
        this.p2.hateSprite = this.add.image(CENTER_X + 30 + (456),(456) + 50,"hate-lg");
        this.p2.hateSprite.setScale(1.75);
        this.p2.hateSprite.visible = false;

        this.cursors = this.input.keyboard.createCursorKeys();   
        let lastLTimeStamp = 0;
        let lastRTimeStamp = 0;

        this.input.keyboard.on("keydown", function(ev){

            if (scene.cursors.down.isDown) {
                return;
            }
            
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
        });

        this.events.addListener('resume', (_, data) => {
            let p = scene.registry.get("hatedPlayer");
            if (p) {
                if (p == "p1") {
                    scene.p1.timeHated += 5000;
                } else {
                    scene.p2.timeHated += 5000;
                }
            }
            
            const player = scene.registry.get("active");
            if (data.hasBought) {
                scene.spawnHashtag(player);
            }
            
            scene.input.enabled = true;
            scene.drawUpgrades(scene.p1);
            scene.drawUpgrades(scene.p2);
        });

        this.createParticles();
    }
    
    spawnHashtag(activePlayer) {
        let scene = this;
        const x = activePlayer == "p1" ? L_MARGIN : CENTER_X + L_MARGIN;
        const tag = scene.add.bitmapText(x, 500, 'type-y', Name.getHashtag(), SMALLFONTSIZE);
        
        scene.physics.add.existing(tag, false);      

        tag.body.setVelocity(Phaser.Math.Between(-400, 400), Phaser.Math.Between(-600, 600));
        tag.body.setBounce(1, 1);
        tag.body.setCollideWorldBounds(true);
        scene.physics.add.collider(tag, scene.wall);
    }

    update(time,delta) {
        
        if (this.cursors.down.isDown) {
                console.log("checking")
                if (this.cursors.left.timeDown || this.cursors.right.timeDown) {
                    if (this.cursors.left.timeDown == this.cursors.right.timeDown) {
                        const winner = Phaser.Utils.Array.GetRandom(["p1", "p2"])
                        this.startMenu(winner)
                    } else {
                        let winner;
                        if (this.cursors.left.isDown && !this.cursors.right.isDown) {
                            winner = "p1";
                        } else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
                            winner = "p2";
                        } else {
                            console.log(this.cursors.left.timeDown);
                            console.log(this.cursors.right.timeDown);
                            winner = this.cursors.left.timeDown > this.cursors.right.timeDown ? "p1" : "p2";
                            console.log(winner)
                        }
                        
                        if (!winner) console.log("no arrow down")
                        else                         this.startMenu(winner)

                            // this.cursors.left.timeDown > this.cursors.right.timeDown 
                            // ? "p1"
                            // : "p2")
                    }
                }
        } 

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
        if (this[player].timeHated > 0) return;
        
        this.input.enabled = false;
        this.registry.set("p1", this.p1);
        this.registry.set("p2", this.p2);
        this.registry.set("active",player);
        this.cursors.down.reset();
        this.cursors.right.reset();
        this.cursors.left.reset();
        this.scene.pause('Main');
        this.scene.run("Menu");
    }

    formatFollowerString(player) {
        let numstr = "x" + Math.floor(player.count).toLocaleString("en-us");
        let maxChars = player.count > Math.pow(10,12) ? 30 : 26
        return numstr.substring(0,maxChars);
    }

    formatRateString(player) {
        if (player.timeHated > 0) {
            return "pile on for " + (player.timeHated / 1000).toFixed(1) + " sec";
        }
        let numstr = "+" + player.rate.toFixed(1) + " f/sec";
        let maxChars = player.rate > Math.pow(10,10) ? 27 : 23
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

        this.p1.name = Name.getName("p1");
        this.p2.name = Name.getName("p2");

        this.p1.LEFT = MARGIN;
        this.p2.LEFT = CENTER_X + MARGIN;

        this.p1.rate = 0;
        this.p2.rate = 0;

        this.p1.upgrades = {};
        this.p2.upgrades = {};
        this.p1.nextAt = 15;
        this.p2.nextAt = 15;

        this.p1.timesHated= 0;
        this.p2.timesHated = 0;

        this.p1.alertText = this.add.bitmapText(CENTER_X - 400, 980, "type-y", "Buy Influence!", SMALLFONTSIZE);
        this.p1.menuIcon = this.add.sprite(CENTER_X - 276, 880, "p1menu");
        this.p1.menuIcon.visible = false;
        this.p1.alertText.visible = false;
        this.p2.alertText = this.add.bitmapText(WIDTH - 400, 980, "type-y", "Buy Influence!", SMALLFONTSIZE);
        this.p2.menuIcon = this.add.sprite(WIDTH - 276, 880, "p2menu");
        this.p2.menuIcon.visible = false;
        this.p2.alertText.visible = false;
                        
        this.p1Sprite.setDisplaySize(150,150);
        this.p2Sprite.setDisplaySize(150,150);
        
        this.registry.set("p1", this.p1)
        this.registry.set("p2", this.p2)
    }

    
    click(player,scene) {

        if (player.timeHated > 0 ) return;
        

        
        player.count += 1;
        if (player == scene.p1) {
            scene.emitter1.explode(Math.random()*3, Math.min(Math.random()*CENTER_X, CENTER_X), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter1b.explode(Math.random()*3, Math.min(Math.random()*CENTER_X, CENTER_X), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter1c.explode(Math.random()*3, Math.min(Math.random()*CENTER_X, CENTER_X), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter1d.explode(Math.random()*3, Math.min(Math.random()*CENTER_X, CENTER_X), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter1e.explode(Math.random()*3, Math.min(Math.random()*CENTER_X, CENTER_X), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            
            scene.tweens.add({
                targets: scene.p1Sprite,
                duration: 75,
                scale: 1.5,
                yoyo: true,
                onComplete: () => scene.p1Sprite.setDisplaySize(150,150)
            })

        } else {
            scene.emitter2.explode(Math.random()*3, Math.min((Math.random()*CENTER_X)+CENTER_X, WIDTH), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter2b.explode(Math.random()*3, Math.min((Math.random()*CENTER_X)+CENTER_X, WIDTH), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter2c.explode(Math.random()*3, Math.min((Math.random()*CENTER_X)+CENTER_X, WIDTH), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter2d.explode(Math.random()*3, Math.min((Math.random()*CENTER_X)+CENTER_X, WIDTH), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            scene.emitter2e.explode(Math.random()*3, Math.min((Math.random()*CENTER_X)+CENTER_X, WIDTH), Math.min(Math.random() * STATUS_TOP, STATUS_L1_TOP));
            
            scene.tweens.add({
                targets: scene.p2Sprite,
                duration: 75,
                scale: 1.5,
                yoyo: true,
                onComplete: () => scene.p2Sprite.setDisplaySize(150,150)
            })
        }
    }

    alertUpgradeAvailable() {
        
        if (this.p1.count >= this.p1.nextAt) {
           // this.p1.alert.visible = true;
            this.p1.menuIcon.visible = true;
            this.p1.menuIcon.angle += 3;
           // this.p1.alert.y = STATUS_L1_TOP + (6 * Math.sin(this.time.now /3));
            this.p1.alertText.visible = true;
           // this.p1alerter.start();
           
        } else {
           // this.p1.alert.visible = false;
            this.p1.alertText.visible = false;
            //this.p1alerter.stop();
            this.p1.menuIcon.visible = false;
        }
        if (this.p2.count >= this.p2.nextAt) {
            this.p2.menuIcon.visible = true;
            this.p2.menuIcon.angle += 3;
           // this.p2.alert.visible = true;
            this.p2.alertText.visible = true;
            //this.p2.alert.y = STATUS_L1_TOP + (6 * Math.sin(this.time.now /3));
           // this.p2alerter.start();
        } else {
         //   this.p2.alert.visible = false;
            this.p2.alertText.visible = false;
            this.p2alerter.stop();
            this.p2.menuIcon.visible = false;
        }
    }

    createParticles(){
        var e1config = {
            speed: [150, 250],
            scale: { start: .2, end: 3},
            emitting: false,
            lifespan: [500, 2000]
        }
        
        var e2config = {
            speed: [150, 250],
            scale: { start: .2, end: 3},
            emitting: false,
            lifespan: [500,2000]
        }
        
        this.emitter1 = this.add.particles(0,0, 'hearto', e1config)
        this.emitter1b = this.add.particles(0,0, 'shareo', e1config)
        this.emitter1c = this.add.particles(0,0, 'planeo', e1config)
        this.emitter1d = this.add.particles(0,0, 'reposto', e1config)
        this.emitter1e = this.add.particles(0,0, 'nodeo', e1config)
        
        this.emitter2 = this.add.particles(0,0, 'heartb', e2config)
        this.emitter2b = this.add.particles(0,0, 'shareb', e2config)
        this.emitter2c = this.add.particles(0,0, 'planeb', e2config)
        this.emitter2d = this.add.particles(0,0, 'repostb', e2config)
        this.emitter2e = this.add.particles(0,0, 'nodeb', e2config)
        
        const alertConfig = {
            speed: [150, 250],
            scale: { start: .2, end: 1.5},
            emitting: false,
            lifespan: [200, 700]
        };

        this.p1alerter = this.add.particles(L_MARGIN, STATUS_TOP, 'alert', alertConfig);
        this.p2alerter = this.add.particles(WIDTH - L_MARGIN, STATUS_TOP, 'alert', alertConfig);
    }

    createUpgrades() {
        let upgrades = {
            "scheduled": new Upgrade({
                name: "Scheduled Post",
                description: "influence on the reg",
                rate: 0.1,
                baseCost: 15,
                icon: "scheduled",
                increase: 1.5
            }),
            "sponsored": new Upgrade({
                name:"SponCon",
                description: "#ad #authentic #bestLife",
                rate: 0.5,
                icon: "question",
                baseCost: 75,
                increase: 1.15
            }),
            "research": new Upgrade({
                name: "Market Research",
                description: "know your #audience",
                rate: 4,
                baseCost: 350,
                increase: 1.3     
            }),
            "bots": new Upgrade({
                name: "Buy Bots",
                description: "Fake it till ya make it, bb",
                rate: 20,
                baseCost: 1000, //2000,
                increase: 1.17
            }),
            "giveaway": new Upgrade({
                name: "Giveaway",
                description: "Share for a chance to be #influenced",
                rate: 60,
                baseCost: 6000, //12,000
                increase: 1.11
            }),
            "youtube": new Upgrade({
                name: "YouTube Stunt",
                description: "It's only a terrible idea if no one's watching",
                rate: 300,
                baseCost: 12345, //43434
                increase: 1.09
            }),
            "apology": new Upgrade({
                name: "Apology Video",
                description: "ok maybe it WAS a terrible idea",
                rate: 1200,
                baseCost: 25000,//200,000
                increase: 1.07
            }),
            "interns": new Upgrade({
                name: "Unpaid Interns",
                description: "Posting for you is valuable experience",
                rate: 5000, //5000
                baseCost: 35000, //1675000
                increase: 1.13
            }),
            "tv": new Upgrade({
                name: "Reality TV Show",
                description: "Deep down, we all knew it would come to this",
                rate: 16666, //66 666
                baseCost: 50000,
                increase: 1.15
            })
        }
        this.registry.set("upgrades", upgrades);
    }

    checkGameOver() {
        if (this.p1.count >= GAMEOVER) {
            this.scene.stop();
            this.registry.set("winner", "p1");
            this.scene.start('GameOver');
        }

        if (this.p2.count >= GAMEOVER) {
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
                const y = 75 + (LINEHEIGHT*1.5)*drawn;
                const textY = y - (LINEHEIGHT/2);
                const x = player == this.p1? L_MARGIN : CENTER_X + L_MARGIN;
                const x2 = x + 60;
                
                const img = this.add.image(x, y, key);
                img.setScale(1.25);
                
                
                
                if (!player.upgrades[key].displayText) {
                    player.upgrades[key].displayText = this.add.bitmapText(
                        x2,
                        textY, 
                        "type-y",
                        "x" + player.upgrades[key].owned, 
                        BIGFONTSIZE);
                    player.upgrades[key].rateText = this.add.bitmapText(
                        x2 + 180,
                        textY + 6, 
                        "type-y", 
                        "+" + (upgrades[key].rate * player.upgrades[key].owned).toFixed(1) + " f/sec", 24   )
                } else {
                    player.upgrades[key].displayText.y = textY + 6;
                    player.upgrades[key].displayText.setText("x" + player.upgrades[key].owned);
                    player.upgrades[key].rateText.y = textY + 6; 
                    player.upgrades[key].rateText.setText("+" + (upgrades[key].rate * player.upgrades[key].owned).toFixed(1) + " f/sec")
                }
                drawn++
            }
        }
    }
    
}

class Upgrade {
    
    constructor({baseCost, increase, name, description, rate, icon}) {
        this.baseCost = baseCost;
        this.increase = increase;
        this.name = name;
        this.description = description;
        this.rate = rate;
        this.icon = icon;
    }
    
    cost (owned) {
        return Math.floor(this.baseCost * Math.pow(this.increase, owned))
    }
}


class Title extends Phaser.Scene {
    constructor() {
        super("Title");
        this.t = 0;
        this.numThings = -0;
        this.maxThings = 100;
        
        this.things = ["tag", "hearto", "heartb", "reposto", "repostb", "nodeo", "nodeb", "shareo", "shareb", "planeo", "planeb", "alert"];
    }

    preload() {
        this.load.image("title", "assets/title.png");
        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
        this.load.bitmapFont('type-b', 'assets/font/typewriter-blue.png', 'assets/font/typewriter-blue.fnt');
        this.load.bitmapFont('type-o', 'assets/font/typewriter-orange.png', 'assets/font/typewriter-orange.fnt');
        this.load.text("tagList", "assets/names.txt");
        this.load.image('hearto', 'assets/heart-orange.png');
        this.load.image('heartb', 'assets/heart-blue.png');
        this.load.image('reposto', 'assets/sharicle-orange.png');
        this.load.image('repostb', 'assets/sharicle-blue.png');
        this.load.image('nodeo', 'assets/node-orange.png');
        this.load.image('nodeb', 'assets/node-blue.png');
        this.load.image('shareo', 'assets/share-arrow-orange.png');
        this.load.image('shareb', 'assets/share-arrow-blue.png');
        this.load.image('planeo', 'assets/plane-orange.png');
        this.load.image('planeb', 'assets/plane-blue.png');
        this.load.image("alert", "assets/alert.png");
    }
    
    makeBouncy(thing) {
        let scene = this;
        
        scene.physics.add.existing(thing, false);      
        
        thing.body.setVelocity(Phaser.Math.Between(-300, 300), Phaser.Math.Between(-300, 300));
        thing.body.setBounce(1, 1);
        thing.body.setCollideWorldBounds(true);
    }
    

    create() {
        let scene = this;
        this.add.image(CENTER_X,CENTER_Y-100,"title");
        this.add.bitmapText(CENTER_X - 170,CENTER_Y*2 - 200,"type-o", "(press any key)", BIGFONTSIZE);
        this.add.bitmapText(CENTER_X - 300,CENTER_Y*2 - 250,"type-y", "Next Level Banana Games", BIGFONTSIZE);
        
        const compet = this.add.bitmapText(CENTER_X + 200, 300, "type-y", "a competitive clicker!", BIGFONTSIZE);
        const twop = this.add.bitmapText(CENTER_X + 200, 300, "type-y", "#twoplayer", BIGFONTSIZE);
                
        this.makeBouncy(compet);
        this.makeBouncy(twop);

        this.input.keyboard.on("keyup", function(){
            scene.scene.stop();
            scene.scene.start("Instructions");
        });
    }
    
    update () {
        let scene = this;
        scene.t += 1;
        
        if (scene.t % 2000 == 0 && scene.numThings < scene.maxThings) {
            scene.numThings++;
            const idx = Phaser.Math.Between(0,scene.things.length);
            if (scene.things[idx] == "tag") {
                const newText = scene.add.bitmapText(Phaser.Math.Between(0,WIDTH), Phaser.Math.Between(0, HEIGHT), "type-b", Name.getHashtag(), SMALLFONTSIZE);
                this.makeBouncy(newText);
            } else {
                const newShare = scene.add.image(Phaser.Math.Between(0,WIDTH), Phaser.Math.Between(0, HEIGHT), scene.things[idx]);
                this.makeBouncy(newShare);
            }
        }
    }
}

class Instructions extends Phaser.Scene {
    constructor(){
        super("Instructions");
    }

    preload() {
        this.load.image("tut", "assets/tut.png");
        this.load.bitmapFont('type-y', 'assets/font/typewriter-yellow.png', 'assets/font/typewriter-yellow.fnt');
    }

    create() {
        let scene = this;
        const tut = this.add.image(CENTER_X,CENTER_Y,"tut");
        tut.setScale(1.3)
        
        scene.add.bitmapText(CENTER_X - 400, 100, "type-y", "First to 100k followers wins!", BIGFONTSIZE)
        this.input.keyboard.on("keyup", function(){
            scene.scene.stop();
            scene.scene.start("Main");
        })
    }
}

let config = {
    type: Phaser.CANVAS,
    width: 1920,
    height: 1080,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [Title]
};

let game = new Phaser.Game(config);
game.scene.add("Main", MainScene, false);
game.scene.add("Instructions", Instructions, false);
game.scene.start("Title");