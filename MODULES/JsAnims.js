"use strict";

var JsAnims = new function JsAnims(){

    this.anim = function anim(){
        console.log("I anim");
    }
}();
this.addModules("JsAnims", JsAnims);