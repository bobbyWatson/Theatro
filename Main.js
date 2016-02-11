"use strict";

var gif;
var frame = 0;
var i  = 0;

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
        || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function loop(){
    THEATRO.update();
    requestAnimationFrame(loop);
}

function loadingLoop(){
    if(THEATRO.totalAssets !== undefined) {
        if(THEATRO.loadedAssets > 0);
            $("#loading-txt").text("Loaded " + ("000" +  Math.floor(THEATRO.loadedAssets / THEATRO.totalAssets * 100)).slice(-3).toString() + "%");
        if (THEATRO.loadedAssets >= THEATRO.totalAssets && THEATRO.loadedAssets !== 0) {
            $(".loading-div").hide();
            return;
        }
    }
    requestAnimationFrame(loadingLoop);
}

$(document).ready(function(){

    THEATRO.init(function(game){
        window.game = game;
        var entity = new THEATRO.Entity();
        entity.addComponent("Sprite",{
            img : THEATRO.AssetBundle.bundles.Main.images.falcon,
            size : {width : 800, height : 600},
            reverse : true
        });
        console.log(THEATRO.AssetBundle.bundles.Main);
        entity.addComponent("Animations",{
            animations : [THEATRO.AssetBundle.bundles.Main.animations.gallery]
        });
        entity.components.Transform.position = {x : 400,y: 300};
/*
        THEATRO.AssetBundle.imgPath = "./BUNDLE1";
        THEATRO.AssetBundle.audioPath = "./BUNDLE1";
        THEATRO.AssetBundle.loadAssets(function(){
            print("toto");
        });
*/

        THEATRO.EventManager.subscribe("click", function(){console.log("click at " + THEATRO.eventSystems.Mouse.position.x + " / " + THEATRO.eventSystems.Mouse.position.y)});

        loop();
    });

    loadingLoop();
});

