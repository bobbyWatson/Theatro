/**
 * Created by Manza016 on 01/02/2016.
 */

"use strict";


//region ** Utils **

window.print = function print(text, color, bold) {
    color = color || "000000";
    bold = bold || false;
    console.log("%c" + text, color + (bold ? ";font-weight:bold;" : ""));
};

window.printError = function printError(text) {
    print(text, "ff0000", true);
};

//endregion

//THEATRO THE SINGLETON CONTAINING THE ENTIRE ENGINE
var THEATRO = new (function THEATRO(){

    //PRIVATES
    var _this = this;
    var game = false;
    var canvas = false;

    //PUBLICS
    this.CONFIG_PATH = "./Config.js";
    //for loading
    this.loadedAssets = 0;
    this.totalAssets = 0;
    this.initilised = false;
    //all the entity layers
    this.allLayers = [];

    //region ** Entity Part **


    THEATRO.prototype.entities = {};
    //Entity Class
    THEATRO.prototype.Entity = function Entity(layer){
        //layer
        if(typeof layer === "string" && layer !== undefined)
            this.layer = layer;
        else
            this.layer = "MAIN";
        //id (integer from 0 to +infinity)
        this.id = THEATRO.prototype.Entity.prototype._count.toString();
        THEATRO.prototype.Entity.prototype._count++;
        //components on the Enity
        this.components = {};
        //Adding to correct Layer
        if(THEATRO.prototype.entities[this.layer] === undefined){
            //create layer if needed
            console.log(this.layer);
            THEATRO.prototype.entities[this.layer] = [];
            _this.allLayers.push(this.layer);
        }
        THEATRO.prototype.entities[this.layer].push(this);

        //Add component
        THEATRO.prototype.Entity.prototype.addComponent = function addComponent (component, params){
            //check component existence
            if(typeof component === "string") {
                component = THEATRO.prototype.components[component];
            }
            if(component !== undefined){
                //Add component and its properties
                this.components[component.id] = {};
                //add properties
                var fields = Object.keys(component);
                for(var i = 0, len = fields.length; i < len; ++i){
                    //setuo in params
                    if(params!== undefined && params[fields[i]] !== undefined)
                        this.components[component.id][fields[i]] = params[fields[i]];
                    //default value
                    else
                        this.components[component.id][fields[i]] = component[fields[i]];
                }
            }else{
                printError("addComponent had a invalid component parameter with " + component);
            }
        };

        //remove Compoponent
        THEATRO.prototype.Entity.prototype.removeComponent = function removeComponent(component){
            //check component existence
            if(typeof component !== "string") {
                component = component.id;
            }
            if(component !== undefined) {
                //remove component from entity
                return (delete this.components[component]);
            }else{
                printError("trying to remove component " + component +" but it does not exist on " + this.id);
            }
        };

        //Bases components
        this.addComponent(_this.components.Transform);
        return this;
    };
    THEATRO.prototype.Entity.prototype._count = 0;

    //endregion

    //region ** Component Part **
    THEATRO.prototype.components = {};

    //Component Class
    THEATRO.prototype.Component = function Component(id, params){
        if(THEATRO.prototype.components.id !== undefined){
            printError("component " + id + " already exists");
        }else if(typeof id !== "string"){
            printError("component id should be a string");
        } else {
            this.id = id;
            this.enable = true;
            //add Component to components list
            THEATRO.prototype.components[id] = this;
            //set component parameters default values
            if (params !== undefined) {
                var paramsKeys = Object.keys(params);
                for (var i = 0, len = paramsKeys.length; i < len; i++) {
                    this[paramsKeys[i]] = params[paramsKeys[i]];
                }
            }
        }
        return this;
    };

    //endregion

    //region ** System Part **

    //All systems
    THEATRO.prototype.systems = {};
    //All systems sorted by layers
    THEATRO.prototype.systemsList = [];
    //All eventSystems
    THEATRO.prototype.eventSystems = {};

    //System class
    THEATRO.prototype.System = function System(id, components, func, params, layer, targetLayers){
        //Check it doesn't already exist
        if(THEATRO.prototype.systems.id != undefined) {
            printError("system " + id + " already exists");
        }
        else if(typeof id !== "string"){
            printError("system id must be a string");
        }
        else{
            this.id =id;
            this.enable = true;
            console.log(layer, targetLayers);
            if(layer !== undefined && typeof layer !== "number")
                printError("System layer must be a number or undefined");
            this.layer = layer || 0;
            if(components !== undefined  && typeof components !== "object" || (components.length > 0 && typeof components[0] !== "string"))
                printError("System requirements must be an array of strings");
            this.requirements = components || [];
            if(typeof func !== "function")
                printError("System update must be a function");
            this.update = func;
            if(targetLayers !== undefined && (typeof targetLayers !== "object" || (targetLayers.length > 0 && typeof targetLayers[0] === "string")))
                printError("System target layers must be an array of strings");
            this.targetLayers = targetLayers || [];

            //Add system to THEATRO
            THEATRO.prototype.systems[id] = this;
            //Set parameter of the system
            if (params !== undefined) {
                var paramsKeys = Object.keys(params);
                for (var i = 0, len = paramsKeys.length; i < len; i++) {
                    this[paramsKeys[i]] = params[paramsKeys[i]];
                }
            }
            //Refresh system List
            if(THEATRO.prototype.systemsList.length > 0)
                setSystemsList();
        }

        //Change the system Layer
        this.changeLayer = function changeLayer(layer){
            this.layer = layer || 0;
            sortSystems(THEATRO.prototype.systemsList);
        };
        return this;
    };

    //turn systems object to an array of systems, sorted by layers
    function setSystemsList (){
        THEATRO.prototype.systemsList = [];
        var keys = Object.keys(THEATRO.prototype.systems);
        for(var i = 0, len  = keys.length; i < len; ++i){
            THEATRO.prototype.systemsList.push(THEATRO.prototype.systems[keys[i]]);
        }
        THEATRO.prototype.systemsList = sortSystems(THEATRO.prototype.systemsList);
    }

    //sort system list by layers with insertion sort
    function sortSystems(items){
        var len     = items.length, value,i,j;
        for (i=0; i < len; i++) {
            value = items[i];
            for (j=i-1; j > -1 && items[j].layer > value.layer; j--) {
                items[j+1] = items[j];
            }
            items[j+1] = value;
        }
        return items;
    }

    //endregion

    //region ** Event System Part **
    //Event system are logic triggered by an event
    THEATRO.prototype.EventSystem = function EventSystem(id, event, func, params){
        //check if id already exists
        if(THEATRO.prototype.systems.id != undefined) {
            printError("event system " + id + " already exists");
        }
        else if(typeof id !== "string" ){
            printError("event system id must be a string")
        }
        else{
            this.id =id;
            this.enable = true;
            //subscribe
            if(typeof event !== "string")
                printError("Event system event param must be a string");
            if(typeof func !== "function")
                printError("Event system func param must be a function");
            THEATRO.prototype.EventManager.subscribe(event, func, this);
            //add to eventSystems list
            THEATRO.prototype.eventSystems[id] = this;
        }
        if (params !== undefined) {
            if(typeof params !== "object")
                printError("EventS System params must be a object");
            var paramsKeys = Object.keys(params);
            for (var i = 0, len = paramsKeys.length; i < len; i++) {
                this[paramsKeys[i]] = params[paramsKeys[i]];
            }
        }
        // proper way de remove an Event system from THEATRO
        this.remove = function remove(){
            THEATRO.prototype.EventManager.unSubscribe(event, this);
            delete THEATRO.prototype.eventSystems[id];
        };

        return this;
    };

    //endregion

    //region ** EventManager Part **
    THEATRO.prototype.EventManager = new (function EventManager(){
        //stored events callback
        this.events = {};
        //subscribe to an event
        this.subscribe = function subscribe(event, callBack, system){
            //check types
            if(typeof  event !== "string")
                printError("Event parameter must be a string to subscribe to an event");
            if(typeof callBack !== "function")
                printError("The callback used to subscribe to an event must be a function");

            if(this.events[event] === undefined){
                this.events[event] = [];
            }
            this.events[event].push([system,callBack]);
            return true;
        };
        //unsubscribe to an event
        this.unSubscribe = function unSubscribe(event, system){
            if(typeof event !== "string")
                printError("event parameter must be a string to unsubscribe to an event");
            if(this.events[event] !== undefined){
                var subs = this.events[event];
                for(var i = 0, len = subs.length; i < len; i++) {
                    if(subs[i][0].id === system.id){
                        if(subs.length == 1)
                            delete this.events[event];
                        else {
                            subs.splice(i, 1);
                            return true;
                        }
                    }
                }
                return true;
            }
            return false;
        };

        //unsubscribe a system to all events
        this.unSubscribeAll = function unSubscribeAll(system){
            var events = Object.keys(this.events);
            for(var i = 0, len = events.length; i < len; ++i){
                this.unSubscribe(events[i], system);
            }
            return true;
        };

        //dispatch an event, as many event parameters can be passed in the dispatch event function  as you want
        this.dispatchEvent = function dispatchEvent(event){
            if(this.events[event] != undefined){
                var args = Array.prototype.slice.call(arguments);
                args = args.slice(1);
                var subs = this.events[event];
                for(var i = 0, len = subs.length; i < len; i++) {
                    subs[i][1].apply(subs[i][0], args);
                }
                return true;
            }
            return false;

        }
    });
    //endregion

    //region ** Game Part **
    //the game object, it is passed after initialisation
    var Game = function Game(canvas){
        this.images = {};
        this.audios = {};
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.height = canvas.height;
        this.ctx.width = canvas.width;
    };
    //endregion

    //region ** Prefabs Part **
    //all prefabs indexed by id
    THEATRO.prototype.prefabs = {};
    //add a prefab to the prefab list
    THEATRO.prototype.addPrefab= function addPrefab(id, prefab) {
        if(typeof id !== "string")
            printError("Prefab id must be a string");
        if (THEATRO.prototype.prefabs[id] !== undefined) {
            printError("prefab " + id + " already exists, thus connot be added");
        } else {
            THEATRO.prototype.prefabs[id] = prefab;
        }
    };

    //create an instance of a prefab
    THEATRO.prototype.createPrefab = function createPrefab(prefab){
        if(typeof prefab === "string"){
            if(THEATRO.prototype.prefabs[prefab] === undefined){
                printError("Prefab " + prefab + " doesn't exist but is trying to be instanciated");
                return false;
            }else{
                prefab = THEATRO.prototype.prefabs[prefab];
            }
        }
        var entity = new THEATRO.prototype.Entity();
        //addComponents
        for(var i = 0, len = prefab.length; i < len; ++i){
            entity.addComponent(prefab[i][0]);
            var properties = Object.keys(prefab[i][1]);
            for(var j = 0, _len = properties.length; j < _len; ++j){
                //set component parameters value
                entity.components[prefab[i][0]][properties[j]] = prefab[i][1][properties[j]];
            }
        }
        return entity;
    };
    //endregion

    //region ** Modules Part **
    //list of modules indexed by id
    THEATRO.prototype.modules = {};
    //add a module to the list
    THEATRO.prototype.addModules = function addModules(id, module){
        if(typeof id !== "string")
            printError("Module id must be a string");
        if(THEATRO.prototype.modules[id] !== undefined){
            printError("the module " + id + "can't be added because a module named " + id + "already exists");
            return false;
        }else{
            THEATRO.prototype.modules[id] = module;
        }
    };

    //endregion

    //region ** Core functions **
    //initialisation of THEATRO
    THEATRO.prototype.init = function init(callback){
        //retreive the config file
        getConfig(
            function(){
                //canvas Creation
                canvas = document.createElement("canvas");
                canvas.id = "GameCanvas";
                canvas.classList.add("GameCanvas");
                var root = document.body;
                if(_this.config.ROOT !== undefined)
                    root = Document.getElementById(_this.config.ROOT);
                root.appendChild(canvas);
                canvas.setAttribute("width",_this.config.RESOLUTION[0]);
                canvas.setAttribute("height",_this.config.RESOLUTION[1]);
                canvas.style.backgroundColor = "#000000";

                //create Game
                game = new Game(canvas);

                //Asset Loading
                //counting all assets
                _this.totalAssets = _this.config.COMPONENTS.length + _this.config.SYSTEMS.length + _this.config.PREFABS.length + _this.config.SCRIPTS.length +
                    _this.config.AUDIOS.length + _this.config.IMAGES.length;

                //the promises used to load assets
                _this.componentPromise = (_this.config.COMPONENTS.length > 0 ? $.Deferred(function(){getJSFile("componentPromise", "COMPONENTS")}) : undefined);
                _this.systemPromise = (_this.config.SYSTEMS.length > 0 ? $.Deferred(function(){getJSFile("systemPromise", "SYSTEMS")}) : undefined);
                _this.modulesPromise = (_this.config.MODULES.length > 0 ? $.Deferred(function(){getJSFile("modulesPromise", "MODULES")}) : undefined);
                _this.prefabsPromise = (_this.config.PREFABS.length > 0 ? $.Deferred(function(){getJSFile("prefabsPromise", "PREFABS")}) : undefined);
                _this.imagesPromise = (_this.config.IMAGES.length > 0 ? $.Deferred(function(){ getImages(game)}) : undefined);
                _this.soundsPromise = (_this.config.AUDIOS.length > 0 ? $.Deferred(function(){ getSounds(game)}) : undefined);
                _this.scriptsPromise = (_this.config.SCRIPTS.length > 0 ? $.Deferred(function(){getJSFile("scriptsPromise", "SCRIPTS", game);}): undefined);

                //Load Components, Systems and prefabs
                $.when(_this.componentPromise, _this.systemPromise, _this.prefabsPromise).done(function(){
                    //add all systems to system list
                    setSystemsList();

                    //Load Images and Audios
                    $.when(_this.imagesPromise, _this.soundsPromise).done(function(){

                        //Load scripts
                        $.when(_this.scriptsPromise).done(function(){
                            //delete completed promises
                            delete _this.componentPromise;
                            delete _this.systemPromise;
                            delete _this.modulesPromise;
                            delete _this.prefabsPromise;
                            delete _this.imagesPromise;
                            delete _this.soundsPromise;
                            delete _this.scriptsPromise;
                            //disable the basics set to false in the config file
                            basicsEnabler();
                            //end Initialisation
                            _this.initilised = true;
                            callback(game);
                        });

                    });
                });
            }
        );
    };

    //load all javascript files from a given category
    function getJSFile(promise, category, scope){
        scope = scope || _this;
        var counter = 0;
        for(var i = 0, len = _this.config[category].length; i < len; ++i){
            loadScript(_this.config[category][i], function(res){
                new Function(res).apply(scope);
                counter ++;
                if(counter === _this.config[category].length) {
                    _this[promise].resolve();
                }
                _this.loadedAssets++;
            });
        }
    }

    //load all images
    function getImages(game){
        var counter = 0;
        for(var i = 0, len = _this.config.IMAGES.length; i < len; ++i){
            var img = new Image();
            img.src = _this.config.IMAGES[i] + "?v=" + Date.now();
            var slash = _this.config.IMAGES[i].lastIndexOf("/") + 1;
            slash = Math.max(slash, _this.config.IMAGES[i].lastIndexOf("\\") + 1);
            var name = _this.config.IMAGES[i].substr(slash, _this.config.IMAGES[i].lastIndexOf(".") - slash);
            game.images[name] = img;
            img.onload = (function (e) {
                counter++;
                if(counter === _this.config.IMAGES.length)
                    _this.imagesPromise.resolve("OK");
                _this.loadedAssets++;
            });
        }
    }

    //load all audios
    function getSounds(game){
        var counter = 0;
        for(var i = 0, len = _this.config.AUDIOS.length; i < len; ++i){
            var audio = new Audio();
            audio.src = _this.config.AUDIOS[i] + "?v=" + Date.now();
            audio.autoplay = false;
            var slash = _this.config.AUDIOS[i].lastIndexOf("/") + 1;
            slash =  Math.max(slash, _this.config.AUDIOS[i].lastIndexOf("\\") + 1);
            var name = _this.config.AUDIOS[i].substr(slash, _this.config.AUDIOS[i].lastIndexOf(".") - slash);
            game.audios[name] = audio;

            audio.addEventListener('canplaythrough', function(e) {
                counter++;
                if(counter === _this.config.AUDIOS.length)
                    _this.soundsPromise.resolve("OK");
                _this.loadedAssets++;
            }, false);
        }
    }

    //Update THEATRO
    THEATRO.prototype.update = function update(){
        //loop through systems
        for(var i = 0, len = this.systemsList.length; i < len; ++i){
            if(this.systemsList[i].enable){
                //loop through layers
                var layers = this.systemsList[i].targetLayers.length !== 0 ? this.systemsList[i].targetLayers : _this.allLayers;
                for(var j = 0, _len = layers.length; j < len; ++j) {
                    var layer = layers[j];
                    if(this.entities[layer] === undefined)
                        continue;
                    //loop through entities
                    for (var k = 0, __len = this.entities[layer].length; k < __len; ++k) {
                        var bool = true;
                        //loop through requirements
                        for (var l = 0, ___len = this.systemsList[i].requirements.length; l < ___len; ++l) {
                            if (this.entities[layer][k].components[this.systemsList[i].requirements[l]] === undefined || !this.entities[layer][k].components[this.systemsList[i].requirements[l]].enable) {
                                bool = false;
                                break;
                            }
                        }
                        // if the entity has the required components and is in a good layer
                        if (bool) {
                            this.systemsList[i].update.call(this.entities[layer][k]);
                        }
                    }
                }
            }
        }
    };

    //load config file
    function getConfig(callback){
        loadScript(_this.CONFIG_PATH, function(res){
            new Function(res).apply(_this);
            callback.apply(_this);
        });
    }

    //ajax call to load a script
    function loadScript(data, callback){
        $.ajax({
            "dataType"      : "text",
            "context"       : THEATRO.prototype,
            "url"           : data +"?v=" + Date.now(),
            "method"        : "GET",
            "success"       : callback
        })
    }
    //endregion

    //region ** Basics **
    //disable the basics set to false in the config file
    function basicsEnabler (){
        //CanvasScaler
        if(_this.config.SCALE === false){
            canvas.width = game.ctx.width = _this.config.RESOLUTION[0];
            canvas.height = game.ctx.height = _this.config.RESOLUTION[1];
            _this.eventSystems.Mouse.position.x /= _this.eventSystems.CanvasScaler.ratio;
            _this.eventSystems.Mouse.position.y /= _this.eventSystems.CanvasScaler.ratio;
            _this.eventSystems.CanvasScaler.remove();
        }else{
            $(window).trigger('resize');
        }
        //MOUSE
        if(_this.config.MOUSE === false) {
            _this.eventSystems.Mouse.remove();
        }else{
            $(canvas).click(function (e) {THEATRO.prototype.EventManager.dispatchEvent("click", e)});
            $(canvas).mousemove(function (e) {THEATRO.prototype.EventManager.dispatchEvent("mouseMove", e)});
        }
    }

    //region ** basics event systems **

    //CanvasScaler
    //scale the canvas in the ratio of the config resolution
    var canvasScaler = new THEATRO.prototype.EventSystem("CanvasScaler", "canvasScale", function(e){
        if(_this.config === undefined)
            return;
        if(_this.config.RESOLUTION === undefined)
            return;

        var window_ratio = e.target.innerWidth / e.target.innerHeight;

        if(window_ratio > (_this.config.RESOLUTION[0] / _this.config.RESOLUTION[1])){
            canvas.height = Math.min(e.target.innerHeight, _this.config.RESOLUTION[1]);
            canvas.width = canvas.height * (_this.config.RESOLUTION[0] / _this.config.RESOLUTION[1]);
        }else{
            canvas.width = Math.min(e.target.innerWidth, _this.config.RESOLUTION[0]);
            canvas.height =e.target.innerWidth / (_this.config.RESOLUTION[0] / _this.config.RESOLUTION[1]);
        }
        _this.eventSystems.CanvasScaler.ratio = _this.config.RESOLUTION[0] /canvas.width ;
        if(game.ctx != undefined){
            game.ctx.width = canvas.width;
            game.ctx.height = canvas.height;
        }
    });
    $(window).resize(function(e){THEATRO.prototype.EventManager.dispatchEvent("canvasScale",e);});

    //get mouse position on the canvas in reference resolution scale
    var Mouse = new THEATRO.prototype.EventSystem("Mouse","mouseMove", function mouseMove(e){
        var ratio = 1;
        if(_this.eventSystems.CanvasScaler !== undefined){
            ratio = _this.eventSystems.CanvasScaler.ratio;
        }
        _this.eventSystems.Mouse.position.x = e.offsetX * ratio;
        _this.eventSystems.Mouse.position.y = e.offsetY * ratio;
    });
    _this.eventSystems.Mouse.position = {x:0,y:0};

    //endregion

    //region ** Basics components **
    //Transform
    //required in all components, its position in the world
    var Transform = new _this.Component("Transform", {
        position    : {x : 0, y : 0},
    });

    //Sprite
    //the 2D aspect of an entity
    var Sprite = new _this.Component("Sprite",{
        offset      : {x : 0, y : 0},
        size        : {width : 10, height : 10},
        img         : undefined,
        fullImg     : true,
        imgPart     : {x : 0, y : 0, width : 10, height: 10},
        reverse     : false,
        alpha       : 1

    });
    //endregion

    //region ** Basics systems **
    //Sprite Renderer
    new this.System("SpriteRenderer", ["Transform", "Sprite"], function() {
        var sprite = this.components.Sprite;
        var transform = this.components.Transform;
        var ratio = 1;
        var reverseFactor = (sprite.reverse === true ? -1 : 1 );
        if (THEATRO.prototype.eventSystems.CanvasScaler) {
            ratio = THEATRO.prototype.eventSystems.CanvasScaler.ratio;
        }

        game.ctx.save();
        game.ctx.globalAlpha = sprite.alpha;
        game.ctx.scale(reverseFactor, 1);

        if (sprite.fullImg) {
            game.ctx.drawImage(sprite.img,
                (transform.position.x * reverseFactor + sprite.offset.x * reverseFactor - sprite.size.width / 2) / ratio , (transform.position.y + sprite.offset.y - sprite.size.height / 2) / ratio,
                sprite.size.width / ratio, sprite.size.height / ratio
            );
        }
        else {
            game.ctx.drawImage(sprite.img,
                sprite.imgPart.x, sprite.imgPart.y, sprite.imgPart.width, sprite.imgPart.height,
                (transform.position.x + sprite.offset.x - sprite.size.width / 2) / ratio, (transform.position.y + sprite.offset.y - sprite.size.height / 2) / ratio,
                sprite.size.width / ratio, sprite.size.height / ratio
            );
        }
        game.ctx.restore();

    });
    //endregion
    //endregion
});
