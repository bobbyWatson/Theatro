"use strict";

function loop(){
    THEATRO.update();
    requestAnimationFrame(loop);
}

function loadingLoop(){
    if(THEATRO.totalAssets !== undefined) {
        $("#loading-txt").text("Loaded " + ("000" +  Math.floor(THEATRO.loadedAssets / THEATRO.totalAssets * 100)).slice(-3).toString() + "%");
        if (THEATRO.loadedAssets >= THEATRO.totalAssets && THEATRO.loadedAssets !== 0) {
            console.log(THEATRO.loadedAssets, THEATRO.totalAssets);
            $(".loading-div").hide();
            return;
        }
    }
    requestAnimationFrame(loadingLoop);
}

$(document).ready(function(){

    THEATRO.init(function(game){
        var entity = new THEATRO.Entity();
        entity.addComponent("Sprite",{
            img : game.images.Nope,
            size : {width : 100, height : 100},
            reverse : true
        });
        console.log(game);
        entity.components.Transform.position = {x : 400,y: 300};

        //console.log(THEATRO.createPrefab("Button"));

        THEATRO.EventManager.subscribe("click", function(){console.log("click at " + THEATRO.eventSystems.Mouse.position.x + " / " + THEATRO.eventSystems.Mouse.position.y)})

        loop();
    });

    loadingLoop();
});

