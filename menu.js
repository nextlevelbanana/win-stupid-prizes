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
        this.CURSOR_BOTTOM_ROW = 960;
        this.DIALOG_TOP_X = 0;
        this.DIALOG_TOP_Y = 80;
        this.DIALOG_WIDTH = 1920;
        this.DIALOG_HEIGHT = 1000;
        this.HATE_MACHINE_X = 240;
        this.HATE_Y = this.CURSOR_BOTTOM_ROW - 60;
        this.COLUMN_2_X = 530;
        this.COLUMN_3_X = 750;
        this.LINEHEIGHT = 80;
        this.IMAGEWIDTH = 50;
        this.FIRST_UPDGRADE_Y = this.CURSOR_START_Y;
        this.UNAVAILABLE_COL = 0x9b9b9b;
        this.ORANGE = 0xff7930;
        this.BLUE = 0x4184fb;
        this.YELLOW = 0xffdd30;
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

        this.hateCost = Math.floor(100 * Math.pow(1.55,this.player.timesHated));

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
                 scene.moveToNextAffordable(-1);
            } else {
                 scene.moveToNextAffordable(scene.cursorIndex);
            }
        });


        this.input.keyboard.on("keyup-DOWN", function(ev) {
            if (scene.hasBought) return;

            if (ev.timeStamp == scene.lastTimeStamp || ev.timeStamp < scene.startSceneTime + 500) return;
            scene.lastTimeStamp = ev.timeStamp;

            if (scene.cursorIndex == 10) {
                    scene.exitScene(false, false);
            } else if (scene.cursorIndex == 9) {
                scene.hasBought = true;
                //hate mob
                console.log("hate mob!")
                scene.emitter2.explode(13,scene.cursor.x, scene.cursor.y);
                scene.player.timesHated++;
                scene.player.count -= scene.hateCost;
                scene.exitScene(true, true);
            } else {
                scene.emitter1.explode(13,scene.cursor.x, scene.cursor.y);
                scene.hasBought = true;

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
                
                scene.time.delayedCall(500,() => scene.exitScene(false, true), [], scene);
            }
        });
    }

    shouldShowHateMachine() {
        return true;//(this.player.upgrades["scheduled"] && (this.player.upgrades["scheduled"].owned >= 10*(1+this.player.timesHated)));
    }

    exitScene(isHating, didBuy) {
        if (isHating) {
            let hatedPlayer = this.active == "p1" ? "p2" : "p1";
            this.registry.set("hatedPlayer", hatedPlayer);
        } else {
            this.registry.set("hatedPlayer", null);
        }
        this.scene.stop();
        this.scene.resume("Main", {hasBought: didBuy});
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
        var e1config = {
            speed: 250,
            scale: { start: .2, end: 2 },
            emitting: false
        }
        
        this.emitter1 = this.add.particles(0,0, this.active == "p1" ? 'hearto' : 'heartb', e1config);

        this.emitter2 = this.add.particles(this.CURSOR_START_X, this.HATE_Y, "hate", {
            speed: 250,
            scale: {start:.2, end:.2}, 
            emitting:false
        });
    }

    moveToNextAffordable(startingIndex) {
        this.cursor.x = this.CURSOR_START_X;

        //0-8 are normal upgrades
        //9 is hate mob
        //10 is cancel
        
        this.cursorIndex = startingIndex == 10  || startingIndex < 0 ? 0 : this.cursorIndex + 1;
        if (startingIndex == 10) {
            //we're on the cancel button and need to loop around
            this.hideDialog();
            this.cursorIndex = -1;
            return this.moveToNextAffordable(-1);
        }
        else if (startingIndex == 9) {
            //move from hate to cancel
            this.hideDialog();
            this.cursor.y = this.CURSOR_BOTTOM_ROW + 20;
        }
        else if (startingIndex == 8) {
            //we need to move to the hate machine
            this.hideDialog();
            if (this.player.count > this.hateCost) {
                this.cursor.y = this.HATE_Y;
            } else {
                this.moveToNextAffordable(9)
            }
            
        }
        else {
            let key = this.upgradeKeys[startingIndex+1];
            let thisUpgrade = this.upgrades[key]; //this is stupid
            let owned = 0;
            if (this.player.upgrades[key]) {
                owned = this.player.upgrades[key].owned;
            }
            while (thisUpgrade.cost(owned) > this.player.count) {
                return this.moveToNextAffordable(startingIndex+1)
            }
            this.cursor.y = this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT*(startingIndex+1)) + 25;

            this.showDialog();
        }
    }

    showDialog() {
        if (!this.hasDrawn || this.cursorIndex >= 8) return;

        this.upgradeDetailsBg.y = this.cursor.y;
        this.upgradeDetailsBgBorder.y = this.cursor.y + 8;

        this.upgradeDetailsBg.visible = true;
        this.upgradeDetailsBgBorder.visible = true;

        this.buybutton.visible = true;
        this.buybuttonText.visible = true;
        
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
        this.upgradeDetailsBgBorder.visible = false;

        this.buybutton.visible = false;
        this.buybuttonText.visible = false;

        this.dialogtext1.visible = false;
        this.dialogFollower.visible = false;
        this.dialogFollowerText.visible = false;
    }

    createDialog() {
        this.upgradeDetailsBgBorder =  this.add.rectangle(this.COLUMN_3_X + 4, this.cursor.y + 29, 350, this.LINEHEIGHT * 2, this.YELLOW);
        this.upgradeDetailsBg =  this.add.rectangle(this.COLUMN_3_X - 8, this.cursor.y + 25, 350, this.LINEHEIGHT * 2, 0x000000, 0.98);
        this.dialogtext1 = this.add.bitmapText(this.COLUMN_2_X + 60,this.cursor.y - 20,"type-y","+" + this.upgrades[this.upgradeKeys[this.cursorIndex]].rate.toFixed(1) + " f/sec",32);
        

        //"move down" and "buy"
        this.add.rectangle((this.DIALOG_WIDTH/2) + 50, this.cursor.y + (this.LINEHEIGHT *0.75), 64, 64,this.active == "p1" ? this.ORANGE : this.BLUE);
        this.add.bitmapText((this.DIALOG_WIDTH/2) + 120, this.cursor.y + (this.LINEHEIGHT *0.75) - 32, "type-y", "move cursor", 48)
        this.buybutton = this.add.rectangle((this.DIALOG_WIDTH/2) + 50, this.cursor.y + (this.LINEHEIGHT * 2), 64, 64, this.YELLOW);
        this.buybuttonText = this.add.bitmapText((this.DIALOG_WIDTH/2) + 120, this.cursor.y + (this.LINEHEIGHT * 2) - 32, "type-y", "buy", 48)

                
        this.dialogFollower = this.add.image(this.COLUMN_2_X + 65,this.cursor.y,"follower-lg");
        this.dialogFollowerText = this.add.bitmapText(this.COLUMN_2_X + 100, this.cursor.y,"type-y",
            this.upgrades[this.upgradeKeys[this.cursorIndex]].cost(this.player.upgrades[this.upgradeKeys[this.cursorIndex]] 
            == undefined ? 0: this.player.upgrades[this.upgradeKeys[this.cursorIndex]].owned),32);

        this.upgradeDetailsBg.depth = 100;
        this.upgradeDetailsBgBorder.depth = 99;
        this.dialogtext1.depth = 101;
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
        //top bar
        this.graphics.fillStyle(0x000000,1);
        this.graphics.fillRect(0,0,this.DIALOG_WIDTH,this.DIALOG_TOP_Y)
      
        this.countdownText = this.add.bitmapText(this.COLUMN_2_X, this.DIALOG_TOP_Y - 39, "type-y", "calculating... " + (((this.startSceneTime+500) - game.getTime())/100).toFixed(0),18);
       
        //cancel button
        this.add.image(this.CURSOR_START_X ,this.CURSOR_BOTTOM_ROW + 20, "cancel")
        this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.CURSOR_BOTTOM_ROW+5,"type-y","cancel",24);
    }

    drawUpgrades(){
        let idx = 0;
        let canAfford = true;
        for (var key in this.upgrades){
            let image = key;
            if(!this.player.upgrades[key] && this.upgrades[key].cost(0) > this.player.count)  {
                canAfford = false;
                image = "question";
                let desc1 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx),"type-y",this.upgrades[key].cost(0),32);
                desc1.setAlpha(0.5);
            } else {
                canAfford = true;
                let desc1 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx),"type-y",this.upgrades[key].name,32);
                let desc2 = this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.FIRST_UPDGRADE_Y+(this.LINEHEIGHT*idx) + 34,"type-y",this.upgrades[key].description,18);
                let owned = this.player.upgrades[key] == undefined ? 0: this.player.upgrades[key].owned
                if (this.upgrades[key].cost(owned) > this.player.count) {
                    desc1.setAlpha(0.5);
                    desc2.setAlpha(0.5);
                    const cost = this.add.bitmapText(this.COLUMN_2_X,this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx),"type-y",this.upgrades[key].cost(owned), 48);
                    cost.setAlpha(0.5)
                    canAfford = false;
                }
               
            }
            let img = this.add.image(this.CURSOR_START_X, this.FIRST_UPDGRADE_Y + (this.LINEHEIGHT * idx) + 25,image).setScale(1.25);
            if (!canAfford) img.setAlpha(0.5);
            idx++;
        }

        if (this.shouldShowHateMachine()) {
            
            let hateImg = this.add.image(this.CURSOR_START_X,this.HATE_Y,"hate");
            hateImg.setScale(1.25);
            if (this.hateCost < this.player.count) {
                this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.HATE_Y - 20,"type-y","Hate Mob",24);
                this.add.bitmapText(this.CURSOR_START_X + this.IMAGEWIDTH,this.HATE_Y + 5,"type-y","Rival rate = 0 for 5 sec",16);
                this.add.image(this.COLUMN_2_X,this.HATE_Y +- 3,"follower-lg");
                this.add.bitmapText(this.COLUMN_2_X + 33,this.HATE_Y - 8, "type-y", this.hateCost,24);
            } else {
                hateImg.setAlpha(0.5);
            }
        }
    }


}
game.scene.add("Menu", MenuScene, false);
