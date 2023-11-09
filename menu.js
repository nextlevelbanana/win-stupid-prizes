class MenuScene extends Phaser.Scene {
    constructor() {
        super("Menu");
        this.cursors;
        this.player;
        this.upgrades;
        this.upgradeKeys = ["scheduled","sponsored","research", "bots", "giveaway", "youtube", "apology", "interns","tv"]
        this.lastTimeStamp = 0;
        this.CURSOR_START_X = 178;
        this.CURSOR_START_Y = 156;
        this.CURSOR_BOTTOM_ROW = 700;
        this.DIALOG_TOP_X = 112;
        this.DIALOG_TOP_Y = 84;
        this.DIALOG_WIDTH = 800;
        this.DIALOG_HEIGHT = 600;
        this.HATE_MACHINE_X = 240;
        this.COLUMN_2_X = 530;
        this.COLUMN_3_X = 750;
        this.LINEHEIGHT = 60;
        this.IMAGEWIDTH = 50;
        this.FIRST_UPDGRADE_Y = this.CURSOR_START_Y+ -this.LINEHEIGHT + 25;
        this.UNAVAILABLE_COL = 0x9b9b9b;
    }

    preload() {
        this.upgrades = this.registry.get("upgrades");
        for (var upgrade in this.upgrades) {
            this.load.image(upgrade, "assets/icons/"+upgrade+".png");
        }
        this.load.image("scheduled", "assets/icons/scheduled.png")
        this.load.image("question", "assets/icons/question.png")
        this.load.image("select", "assets/icons/select.png");
        this.load.image("cancel", "assets/icons/cancel.png");
        this.load.image("move1", "assets/icons/move-p1.png");
        this.load.image("move2", "assets/icons/move-p2.png");

        this.load.image("cursor2", "assets/rectB.png");
        this.load.image("cursor1", "assets/rectO.png");
        this.load.image("follower", "assets/followers.png");

        this.load.image("hate", "assets/icons/hate.png");
        

    }

    create() {
        let scene = this;
        this.hasBought = false;
        this.startSceneTime = game.getTime();

        this.graphics = this.add.graphics();
        this.active = this.registry.get("active");
        
        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursor = this.add.sprite(this.CURSOR_START_X, this.FIRST_UPDGRADE_Y + this.LINEHEIGHT + 25, this.active == "p1" ? "cursor1" : "cursor2").setScale(1.3);
        this.cursorIndex = 0;
        this.cursor.visible= false;

        this.isInitialized = false;
        this.hasDrawn = false;

        let col = this.active == "p1" ? 0xff7930 : 0x4184fb;

        this.graphics.fillStyle(col,124/255);
        this.graphics.fillRect(0,0,1024,768)

        //the main dialog
        this.graphics.fillStyle(0x000000,1);
        this.graphics.fillRect(this.DIALOG_TOP_X,this.DIALOG_TOP_Y,this.DIALOG_WIDTH, this.DIALOG_HEIGHT);
        
        this.graphics.fillStyle(0xffdd30,1);
        this.graphics.lineStyle(8,0xffdd30,1);
        this.graphics.strokeRect(this.DIALOG_TOP_X + 20,this.DIALOG_TOP_Y + 20,this.DIALOG_WIDTH-40,this.DIALOG_HEIGHT-40);
        //inner border
        this.graphics.lineStyle(4,col,1);
        this.graphics.strokeRect(this.DIALOG_TOP_X+24,this.DIALOG_TOP_Y + 26,this.DIALOG_WIDTH - 48,this.DIALOG_HEIGHT - 52);
        this.graphics.fillStyle(col, 124/255);
        this.graphics.fillRect(this.DIALOG_TOP_X + 26,this.DIALOG_TOP_Y + 26,this.DIALOG_WIDTH - 52,this.DIALOG_HEIGHT - 56);
        this.player = this.registry.get(this.active);

        this.cancelX = this.COLUMN_3_X;
        this.hateCost = Math.floor(100 * Math.pow(1.15,this.player.timesHated));

        this.drawInstructions(col);

        this.cursors.down.reset();
        this.cursors.right.reset();
        this.cursors.left.reset();
        this.createParticles();
        
        this.lastSelectTimeStamp = 0;

        this.createDialog();

        this.input.keyboard.on("keyup-" + (this.active == "p1" ? "LEFT" : "RIGHT"), function(ev) {
            if (scene.lastSelectTimeStamp == ev.timeStamp || ev.timeStamp < scene.startSceneTime + 500) return;
            scene.lastSelectTimeStamp = ev.timeStamp;

            if (scene.cursor.y == scene.CURSOR_BOTTOM_ROW) {
                if (scene.cursor.x == scene.cancelX) {
                 scene.moveToNextAffordable(-1);
                } else {
                    scene.cursor.x = scene.cancelX;
                }
            } else {
                 scene.moveToNextAffordable(scene.cursorIndex);
            }
        });


        this.input.keyboard.on("keyup-DOWN", function(ev) {
            if (scene.hasBought) return;

            if (ev.timeStamp == scene.lastTimeStamp || ev.timeStamp < scene.startSceneTime + 500) return;
            scene.lastTimeStamp = ev.timeStamp;

            if (scene.cursorIndex >= 9) {
                //cancel
                if (scene.cursor.x == scene.cancelX) {
                    scene.exitScene();
                } else {
                    scene.hasBought = true;
                    //hate mob
                    scene.emitter2.explode(13,scene.cursor.x, scene.cursor.y);
                    scene.player.timesHated++;
                    scene.player.count -= scene.hateCost;
                    scene.exitScene(true);
                }
            } else {
                scene.emitter1.explode(13,scene.cursor.x, scene.cursor.y);
                scene.hasBought = true;
               // let index = (scene.cursor.y - 126) / 41;
                let key = scene.upgradeKeys[scene.cursorIndex];
                let thisUpgrade = scene.upgrades[key]; //this is stupid
                let owned = 0;
                if (scene.player.upgrades[key]) {
                    owned = scene.player.upgrades[key].owned;
                }
                scene.player.count -= thisUpgrade.cost(owned);
                if(!scene.player.upgrades[key]) {
                    scene.player.upgrades[key] = {
                        name: thisUpgrade.name,
                        owned: 1
                    }
                } else {
                    scene.player.upgrades[key].owned ++;
                }

                scene.player.rate += thisUpgrade.rate;
                scene.player.nextAt = scene.calcNext();

                scene.registry.set(this.active, scene.player);
                
                scene.time.delayedCall(500,scene.exitScene, [], scene);
            }
        });
    }

    shouldShowHateMachine() {
        return (this.player.upgrades["scheduled"] && (this.player.upgrades["scheduled"].owned >= 10*(1+this.player.timesHated)));
    }

    exitScene(isHating) {
        if (isHating) {
            let hatedPlayer = this.active == "p1" ? "p2" : "p1";
            this.registry.set("hatedPlayer", hatedPlayer);
        } else {
            this.registry.set("hatedPlayer", null);
        }
        this.scene.stop();
        this.scene.resume("Main");
    }

    calcNext() {
        let nextCost = Number.MAX_SAFE_INTEGER;
        for(var key in this.upgrades) {
            let owned = 0;
            if (this.player.upgrades[key]) owned = this.player.upgrades[key].owned;
            if (this.upgrades[key].cost(owned) < nextCost) {
                nextCost = this.upgrades[key].cost(owned);
            }
        }
        return nextCost;
    }

    createParticles() {
        var particles = this.add.particles('heart');

        var e1config = {
            speed: 150,
            scale: { start: .2, end: 2 },
            tint: this.active == "p1"? 0xff7930 : 0x4184fb,
            on: false
        }

        this.emitter1 = particles.createEmitter(e1config);

        this.emitter2 = this.add.particles("hate").createEmitter({speed:150,scale:{start:.2, end:.2},on:false, x:this.CURSOR_START_X,y:this.CURSOR_BOTTOM_ROW});
    }

    moveToNextAffordable(startingIndex) {
        if(startingIndex == 8) {
            this.hideDialog();
            //move to cancel button
            this.cursor.y = this.CURSOR_BOTTOM_ROW + 20;
            this.cursor.x = this.shouldShowHateMachine() ? this.CURSOR_START_X : this.cancelX;

            if (this.shouldShowHateMachine() && this.player.count < this.hateCost) {
                this.cursor.x = this.cancelX;
            } 
            this.cursorIndex = 9;
            return 
        } else if (startingIndex == 9) {
            this.hideDialog();
            this.cursorIndex = 0;
            return this.moveToNextAffordable(-1);
        }

        this.cursor.x = this.CURSOR_START_X;

        let key = this.upgradeKeys[startingIndex+1];
        console.log("index: " + startingIndex, "key: " + key);
        let thisUpgrade = this.upgrades[key]; //this is stupid
        let owned = 0;
        if (this.player.upgrades[key]) {
            owned = this.player.upgrades[key].owned;
        }
        while (thisUpgrade.cost(owned) > this.player.count) {
            return this.moveToNextAffordable(startingIndex+1)
        }
        this.cursor.y = this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT*(startingIndex+1)) + 25;
        this.cursorIndex = startingIndex+1;

        this.showDialog();
    }

    showDialog() {
        if (!this.hasDrawn || this.cursorIndex >= 8) return;

        this.upgradeDetailsBg.y = this.cursor.y;
        this.buybutton.y = this.cursor.y + (this.LINEHEIGHT * 0.75);
        this.upgradeDetailsBg.visible = true;
        this.buybutton.visible = true;
        
        this.dialogtext1.y = this.cursor.y - 50;
        this.dialogtext1.setText("+" + this.upgrades[this.upgradeKeys[this.cursorIndex]].rate.toFixed(1) + " f/sec");
        this.dialogtext1.visible = true;
        this.dialogFollower.y = this.cursor.y + 32;
        this.dialogFollowerText.y = this.cursor.y + 16;
        this.dialogFollower.visible = true;
        this.dialogFollowerText.setText(this.upgrades[this.upgradeKeys[this.cursorIndex]].cost(this.player.upgrades[this.upgradeKeys[this.cursorIndex]] 
            == undefined ? 0: this.player.upgrades[this.upgradeKeys[this.cursorIndex]].owned))
        this.dialogFollowerText.visible = true;
    }

    hideDialog() {
        this.upgradeDetailsBg.visible = false;
        this.buybutton.visible = false;
        this.dialogtext1.visible = false;
        this.dialogFollower.visible = false;
        this.dialogFollowerText.visible = false;

    }

    createDialog() {
        this.upgradeDetailsBg =  this.add.rectangle(this.COLUMN_3_X, this.cursor.y + 25, this.DIALOG_WIDTH/2, this.LINEHEIGHT * 2, 0x000000, 0.98);
        this.dialogtext1 = this.add.bitmapText(this.COLUMN_2_X + 60,this.cursor.y - 20,"type-y","+" + this.upgrades[this.upgradeKeys[this.cursorIndex]].rate.toFixed(1) + " f/sec",32);

        this.buybutton = this.add.image(this.COLUMN_2_X + (this.DIALOG_WIDTH/2) - 40,this.cursor.y + (this.LINEHEIGHT *0.75),"select");
        this.dialogFollower = this.add.image(this.COLUMN_2_X + 65,this.cursor.y,"follower-lg");
        this.dialogFollowerText = this.add.bitmapText(this.COLUMN_2_X + 100, this.cursor.y,"type-y",
            this.upgrades[this.upgradeKeys[this.cursorIndex]].cost(this.player.upgrades[this.upgradeKeys[this.cursorIndex]] 
            == undefined ? 0: this.player.upgrades[this.upgradeKeys[this.cursorIndex]].owned),32);

        this.upgradeDetailsBg.depth = 100;
        this.dialogtext1.depth = 101;
        this.buybutton.depth = 101;
        this.dialogFollower.depth = 101;
        this.dialogFollowerText.depth = 101; 
        this.hideDialog();

    }

    update() {
        if(!this.isInitialized) {
            this.moveToNextAffordable(-1);
            this.isInitialized = true;
        }

        if (this.startSceneTime + 500 <= game.getTime()) {
            this.countdownText.visible = false;
            if (!this.hasDrawn) {
                this.add.image(this.COLUMN_2_X,this.DIALOG_TOP_Y - 25,"follower-lg")
                this.add.bitmapText(this.COLUMN_2_X + 30 , this.DIALOG_TOP_Y - 37,"type-y", Math.floor(this.player.count).toLocaleString("en-us"),28);
                this.drawUpgrades();
                this.cursor.visible = true;
                
                this.hasDrawn = true;
                this.showDialog();

            }
    
        } else {
            this.countdownText.setText("calculating..." + (((this.startSceneTime+500) - game.getTime())/100).toFixed(0));
        }
    }

    drawInstructions(col){
        this.graphics.fillStyle(0x000000,1);
        this.graphics.fillRect(this.DIALOG_TOP_X,this.DIALOG_TOP_Y - 40,this.DIALOG_WIDTH,30)
        this.add.image(this.HATE_MACHINE_X,this.DIALOG_TOP_Y - 25,this.active == "p1" ? "move1":"move2");
        this.graphics.fillStyle(0x000000,1);
        this.graphics.fillRect(this.DIALOG_TOP_X,this.CURSOR_BOTTOM_ROW - 5,this.DIALOG_WIDTH,50)

        this.countdownText = this.add.bitmapText(this.COLUMN_2_X, this.DIALOG_TOP_Y - 39, "type-y", "calculating... " + (((this.startSceneTime+500) - game.getTime())/100).toFixed(0),18);
        this.add.image(this.cancelX,this.CURSOR_BOTTOM_ROW + 20, "cancel")
        this.add.bitmapText(this.cancelX+ this.IMAGEWIDTH,this.CURSOR_BOTTOM_ROW+5,"type-y","cancel",24);
    }

    drawUpgrades(){
        let idx = 0;
        for (var key in this.upgrades){
            let image = key;
            if(!this.player.upgrades[key] && this.upgrades[key].cost(0) > this.player.count)  {
                image = "question";
                let desc1 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx),"type-y",this.upgrades[key].cost(0),32);
                desc1.setTint(this.UNAVAILABLE_COL);
            } else {
                let desc1 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx),"type-y",this.upgrades[key].name,32);
                let desc2 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y+(this.LINEHEIGHT*idx) + 34,"type-y",this.upgrades[key].description,18);
                let owned = this.player.upgrades[key] == undefined ? 0: this.player.upgrades[key].owned
                if (this.upgrades[key].cost(owned) > this.player.count) {
                    desc1.setTint(this.UNAVAILABLE_COL);
                    desc2.setTint(this.UNAVAILABLE_COL);
                }
               
            }
            let img = this.add.image(this.CURSOR_START_X, this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx) + 25,image).setScale(1.25);
            if (image == "question" || this.upgrades[key].cost(0) > this.player.count) img.setTint(this.UNAVAILABLE_COL);
            idx++;
        }

        if (this.shouldShowHateMachine()) {
            let hateImg = this.add.image(this.CURSOR_START_X,this.CURSOR_BOTTOM_ROW + 20,"hate");
            hateImg.setScale(1.25);
            this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.CURSOR_BOTTOM_ROW + 2,"type-y","Hate Mob",24);
            this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.CURSOR_BOTTOM_ROW + 27,"type-y","Rival rate = 0 for 5 sec",16);
            this.add.image(this.COLUMN_2_X,this.CURSOR_BOTTOM_ROW + 17,"follower-lg");
            //this.add.image(350,535,"scheduled").setScale(0.48);
            this.add.bitmapText(this.COLUMN_2_X + 33,this.CURSOR_BOTTOM_ROW + 12, "type-y", this.hateCost,24);
           // this.add.bitmapText(370,530, "type-y", (1+this.player.timesHated)*10 ,12);        
        }
    }


}
game.scene.add("Menu", MenuScene, false);
