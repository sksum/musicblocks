/**
 * @file This contains the prototype of the Turtles component.
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA.
 */

// What is the scale factor when stage is shrunk?
const CONTAINERSCALEFACTOR = 4;

/**
 * Class for managing all the turtles.
 *
 * @class
 * @classdesc This is the prototype of the Turtles controller which
 * acts as a bridge between the Turtles model and the Turtles view,
 * and serves as a gateway to any external code.
 *
 * External code instantiates this class, and can access all the members
 * of TurtlesView and TurtlesModel.
 *
 * This component contains properties and controls relevant to the set
 * of all turtles like maintaining the canvases on which turtles draw.
 */
class Turtles {
    /**
     * @constructor
     */
    constructor() {
        // Import members of model and view (no arguments for model or view)
        importMembers(this);

        this._refreshCanvas = null;     // function to refresh canvas
    }

    /**
     * @param {Function} refreshCanvas - function to refresh canvas after view update
     */
    set refreshCanvas(refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
    }

    /**
     * @returns {Function} function to refresh canvas after view update
     */
    get refreshCanvas() {
        return this._refreshCanvas;
    }

    /**
     * Adds turtle to start block.
     *
     * @param {Object} startBlock - name of startBlock
     * @param {Object} infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    addTurtle(startBlock, infoDict) {
        this.add(startBlock, infoDict);
        if (this.isShrunk()) {
            let t = last(this.turtleList);
            t.container.scaleX = CONTAINERSCALEFACTOR;
            t.container.scaleY = CONTAINERSCALEFACTOR;
            t.container.scale = CONTAINERSCALEFACTOR;
        }
    }

    /**
     * Add a new turtle for each start block.
     * Creates container for each turtle.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    add(startBlock, infoDict) {
        if (startBlock != null) {
            console.debug("adding a new turtle " + startBlock.name);
            if (startBlock.value !== this.turtleList.length) {
                startBlock.value = this.turtleList.length;
                console.debug("turtle #" + startBlock.value);
            }
        } else {
            console.debug("adding a new turtle: startBlock is null");
        }

        let blkInfoAvailable =
            typeof infoDict === "object" && Object.keys(infoDict).length > 0 ?
                true : false;

        // Unique ID of turtle is time of instantiation for the first time
        let id =
            blkInfoAvailable && "id" in infoDict && infoDict["id"] !== Infinity ?
                infoDict["id"] : Date.now();

        let turtleName =
            blkInfoAvailable && "name" in infoDict ?
                infoDict["name"] : _("start");

        // Instantiate a new Turtle object
        let turtle = new Turtle(id, turtleName, this, startBlock);

        // Add turtle model properties and store color index for turtle
        this.addTurtleStageProps(turtle, blkInfoAvailable, infoDict);

        let turtlesStage = this.stage;

        this.reorderButtons(turtlesStage);

        let i = this.turtleList.length % 10;    // used for turtle (mouse) skin color
        this.turtleList.push(turtle);           // add new turtle to turtle list

        this.createArtwork(turtle, i);

        this.createHitArea(turtle);

        /*
        ===================================================
         Add event handlers
        ===================================================
        */

        turtle.container.on("mousedown", event => {
            let scale = this.scale;
            let offset = {
                x: turtle.container.x - event.stageX / scale,
                y: turtle.container.y - event.stageY / scale
            };

            turtlesStage.dispatchEvent("CursorDown" + turtle.id);
            console.debug("--> [CursorDown " + turtle.name + "]");

            turtle.container.removeAllEventListeners("pressmove");
            turtle.container.on("pressmove", event => {
                if (turtle.running) {
                    return;
                }

                turtle.container.x = event.stageX / scale + offset.x;
                turtle.container.y = event.stageY / scale + offset.y;
                turtle.x = this.screenX2turtleX(turtle.container.x);
                turtle.y = this.screenY2turtleY(turtle.container.y);
                this.refreshCanvas();
            });
        });

        turtle.container.on("pressup", event => {
            console.debug("--> [CursorUp " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorUp" + turtle.id);
        });

        turtle.container.on("click", event => {
            // If turtles listen for clicks then they can be used as buttons
            console.debug("--> [click " + turtle.name + "]");
            turtlesStage.dispatchEvent("click" + turtle.id);
        });

        turtle.container.on("mouseover", event => {
            console.debug("--> [mouseover " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOver" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX *= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.refreshCanvas();
        });

        turtle.container.on("mouseout", event => {
            console.debug("--> [mouseout " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOut" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX /= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.refreshCanvas();
        });

        document.getElementById("loader").className = "";

        this.addTurtleGraphicProps(turtle, blkInfoAvailable, infoDict);

        this.refreshCanvas();
    }

    /**
     * Toggles 'running' boolean value for all turtles.
     *
     * @returns {void}
     */
    markAllAsStopped() {
        for (let turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
        }

        this.refreshCanvas();
    }

    // ================================ MODEL =================================
    // ========================================================================

    /**
     * @param {Object} stage
     */
    set masterStage(stage) {
        this._masterStage = stage;
    }

    /**
     * @returns {Object} - master stage object
     */
    get masterStage() {
        return this._masterStage;
    }

    /**
     * @param {Object} stage
     */
    set stage(stage) {
        this._stage = stage;
        this._stage.addChild(this._borderContainer);
    }

    /**
     * @returns {Object} - stage object
     */
    get stage() {
        return this._stage;
    }

    /**
     * @param {Object} canvas
     */
    set canvas(canvas) {
        this._canvas = canvas;
    }

    /**
     * @return {Object} canvas object
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @returns {Object} border container object
     */
    get borderContainer() {
        return this._borderContainer;
    }

    /**
     * @param {Function} hideMenu - hide auxiliary menu
     */
    set hideMenu(hideMenu) {
        this._hideMenu = hideMenu;
    }

    /**
     * @returns {Function} hide auxiliary menu
     */
    get hideMenu() {
        return this._hideMenu;
    }

    /**
     * @param {Function} doClear - reset canvas and turtles
     */
    set doClear(doClear) {
        this._doClear = doClear;
    }

    /**
     * @returns {Function} reset canvas and turtles
     */
    get doClear() {
        return this._doClear;
    }

    /**
     * @param {Function} hideGrids - hide canvas gridwork
     */
    set hideGrids(hideGrids) {
        this._hideGrids = hideGrids;
    }

    /**
     * @returns {Function} hide canvas gridwork
     */
    get hideGrids() {
        return this._hideGrids;
    }

    /**
     * @param {Function} doGrid - show canvas gridwork
     */
    set doGrid(doGrid) {
        this._doGrid = doGrid;
    }

    /**
     * @returns {Function} show canvas gridwork
     */
    get doGrid() {
        return this._doGrid;
    }

    /**
     * @returns {Object[]} list of Turtle objects
     */
    get turtleList() {
        return this._turtleList;
    }

    // ================================ VIEW ==================================
    // ========================================================================

    /**
     * @returns {Number} scale factor
     */
    get scale() {
        return this._scale;
    }
}

/**
 * Class pertaining to Turtles Model.
 *
 * @class
 * @classdesc This is the prototype of the Model for the Turtles component.
 * It should store the data structures that control behavior of the model,
 * and the methods to interact with them.
 */
Turtles.TurtlesModel = class {
    /**
     * @constructor
     */
    constructor() {
        this._masterStage = null;       // createjs stage
        this._stage = null;             // createjs container for turtle

        this._canvas = null;            // DOM canvas element

        // These functions are directly called by TurtlesView
        this._hideMenu = null;          // function to hide aux menu
        this._doClear = null;           // function to clear the canvas
        this._hideGrids = null;         // function to hide all grids
        this._doGrid = null;            // function that renders Cartesian/Polar
                                        //  grids and changes button labels

        // createjs border container
        this._borderContainer = new createjs.Container();

        // List of all of the turtles, one for each start block
        this._turtleList = [];

        /**
         * @todo Add methods to initialize the turtleList, directly access the
         * required turtle rather than having to "get" the turtleList itself,
         * and return the length of the turtleList (number of Turtles).
         */
    }

    /**
     * Adds createjs related properties of turtles and turtlesStage.
     *
     * @param {Object} turtle
     * @param {Boolean} blkInfoAvailable
     * @param {Object} infoDict
     * @returns {void}
     */
    addTurtleStageProps(turtle, blkInfoAvailable, infoDict) {
        // Add x- and y- coordinates
        if (blkInfoAvailable) {
            if ("xcor" in infoDict) {
                turtle.x = infoDict["xcor"];
            }
            if ("ycor" in infoDict) {
                turtle.y = infoDict["ycor"];
            }
        }

        let turtlesStage = this._stage;

        // Each turtle needs its own canvas
        turtle.imageContainer = new createjs.Container();
        turtlesStage.addChild(turtle.imageContainer);
        turtle.penstrokes = new createjs.Bitmap();
        turtlesStage.addChild(turtle.penstrokes);

        turtle.container = new createjs.Container();
        turtlesStage.addChild(turtle.container);
        turtle.container.x = this.turtleX2screenX(turtle.x);
        turtle.container.y = this.turtleY2screenY(turtle.y);
    }

    /**
     * Creates sensor area for Turtle body.
     *
     * @param {*} turtle - Turtle object
     * @returns {void}
     */
    createHitArea(turtle) {
        let hitArea = new createjs.Shape();
        hitArea.graphics.beginFill("#FFF").drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        turtle.container.hitArea = hitArea;
    }

    /**
     * Adds graphic specific properties of Turtle object.
     *
     * @param {Object} turtle
     * @param {Boolean} blkInfoAvailable
     * @param {Object} infoDict
     * @returns {void}
     */
    addTurtleGraphicProps(turtle, blkInfoAvailable, infoDict) {
        setTimeout(() => {
            if (blkInfoAvailable) {
                if ("heading" in infoDict) {
                    turtle.painter.doSetHeading(infoDict["heading"]);
                }

                if ("pensize" in infoDict) {
                    turtle.painter.doSetPensize(infoDict["pensize"]);
                }

                if ("grey" in infoDict) {
                    turtle.painter.doSetChroma(infoDict["grey"]);
                }

                if ("shade" in infoDict) {
                    turtle.painter.doSetValue(infoDict["shade"]);
                }

                if ("color" in infoDict) {
                    turtle.painter.doSetColor(infoDict["color"]);
                }

                if ("name" in infoDict) {
                    turtle.painter.rename(infoDict["name"]);
                }
            }
        }, 2000);
    }

    /**
     * Returns boolean value depending on whether turtle is running.
     *
     * @return {Boolean} - running
     */
    running() {
        for (let turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    }
};

/**
 * Class pertaining to Turtles View.
 *
 * @class
 * @classdesc This is the prototype of the View for the Turtles component.
 * It should make changes to the view, while using members of the Model
 * through Turtles (controller). An action may require updating the state
 * (of the Model), which it can do by calling methods of the Model, also
 * through Turtles (controller).
 */
Turtles.TurtlesView = class {
    /**
     * @constructor
     */
    constructor() {
        this._scale = 1.0;              // scale factor in [0, 1]
        this._w = 1200;                 // stage width
        this._h = 900;                  // stage height

        this._isShrunk = false;         // whether canvas is collapsed

        /**
         * @todo write comments to describe each variable
         */
        this._expandedBoundary = null;
        this._collapsedBoundary = null;
        this._expandButton = null;      // used by add method
        this._expandLabel = null;
        this._expandLabelBG = null;
        this._collapseButton = null;    // used by add method
        this._collapseLabel = null;
        this._collapseLabelBG = null;
        this._clearButton = null;       // used by add method
        this._clearLabel = null;
        this._clearLabelBG = null;
        this._gridButton = null;        // used by add method
        this._gridLabel = null;
        this._gridLabelBG = null;

        // canvas background color
        this._backgroundColor = platformColor.background;

        this._locked = false;
        this._queue = [];               // temporarily stores [w, h, scale]
    }

    /**
     * Sets the scale of the turtle canvas.
     *
     * @param {Number} scale - scale factor in [0, 1]
     * @returns {void}
     */
    setStageScale(scale) {
        this.stage.scaleX = scale;
        this.stage.scaleY = scale;
        this.refreshCanvas();
    }

    /**
     * Scales the canvas.
     *
     * @param {Number} w - width
     * @param {Number} h - height
     * @param {Number} scale - scale factor in [0, 1]
     * @returns {void}
     */
    doScale(w, h, scale) {
        if (this._locked) {
            this._queue = [w, h, scale];
        } else {
            this._scale = scale;
            this._w = w / scale;
            this._h = h / scale;
        }

        this.makeBackground();
    }

    /**
     * @returns {Boolean} - whether canvas is collapsed
     */
    isShrunk() {
        return this._isShrunk;
    }

    /**
     * @param {String} text
     * @returns {void}
     */
    setGridLabel(text) {
        if (this._gridLabel !== null) {
            this._gridLabel.text = text;
        }
    }

    /**
     * @param {String} color - background color
     */
    setBackgroundColor(color) {
        this._backgroundColor = color;
    }

    /**
     * Adds y offset to stage.
     *
     * @param {Number} dy - delta y
     * @returns {void}
     */
    deltaY(dy) {
        this.stage.y += dy;
    }

    /**
     * Invert y coordinate.
     *
     * @private
     * @param {Number} y - y coordinate
     * @returns {Number} inverted y coordinate
     */
    _invertY(y) {
        return this.canvas.height / (2.0 * this._scale) - y;
    }

    /**
     * Convert on screen x coordinate to turtle x coordinate.
     *
     * @param {Number} x - screen x coordinate
     * @returns {Number} turtle x coordinate
     */
    screenX2turtleX(x) {
        return x - this.canvas.width / (2.0 * this._scale);
    }

    /**
     * Convert on screen y coordinate to turtle y coordinate.
     *
     * @param {Number} y - screen y coordinate
     * @returns {Number} turtle y coordinate
     */
    screenY2turtleY(y) {
        return this._invertY(y);
    }

    /**
     * Convert turtle x coordinate to on screen x coordinate.
     *
     * @param {Number} x - turtle x coordinate
     * @returns {Number} screen x coordinate
     */
    turtleX2screenX(x) {
        return this.canvas.width / (2.0 * this._scale) + x;
    }

    /**
     * Convert turtle y coordinate to on screen y coordinate.
     *
     * @param {Number} y - turtle y coordinate
     * @returns {Number} screen y coordinate
     */
    turtleY2screenY(y) {
        return this._invertY(y);
    }

    /**
     * Brings stage control buttons to front.
     *
     * @param {Object} turtlesStage
     * @returns {void}
     */
    reorderButtons(turtlesStage) {
        // Ensure that the buttons are on top
        turtlesStage.removeChild(this._expandButton);
        turtlesStage.addChild(this._expandButton);
        turtlesStage.removeChild(this._collapseButton);
        turtlesStage.addChild(this._collapseButton);
        turtlesStage.removeChild(this._clearButton);
        turtlesStage.addChild(this._clearButton);
        if (this._gridButton !== null) {
            turtlesStage.removeChild(this._gridButton);
            turtlesStage.addChild(this._gridButton);
        }
    }

    /**
     * Creates the artwork for the turtle (mouse) 's skin.
     *
     * @param {Object} turtle
     * @param {Number} i
     * @returns {void}
     */
    createArtwork(turtle, i) {
        let artwork = TURTLESVG;
        artwork = sugarizerCompatibility.isInsideSugarizer() ?
            artwork
                .replace(/fill_color/g, sugarizerCompatibility.xoColor.fill)
                .replace(
                    /stroke_color/g,
                    sugarizerCompatibility.xoColor.stroke
                ) :
            artwork
                .replace(/fill_color/g, FILLCOLORS[i])
                .replace(/stroke_color/g, STROKECOLORS[i]);

        turtle.makeTurtleBitmap(artwork, this.refreshCanvas);

        turtle.painter.color = i * 10;
        turtle.painter.canvasColor = getMunsellColor(
            turtle.painter.color,
            DEFAULTVALUE,
            DEFAULTCHROMA
        );
    }

    /**
     * Makes background for canvas: clears containers, renders buttons.
     *
     * @param setCollapsed - specify whether the background should be collapsed
     */
    makeBackground(setCollapsed) {
        let doCollapse = setCollapsed === undefined ? false : setCollapsed;

        let borderContainer = this.borderContainer;

        // Remove any old background containers
        for (let i = 0; i < borderContainer.children.length; i++) {
            borderContainer.children[i].visible = false;
            borderContainer.removeChild(
                borderContainer.children[i]
            );
        }

        let turtlesStage = this.stage;
        // We put the buttons on the stage so they will be on top
        if (this._expandButton !== null) {
            turtlesStage.removeChild(this._expandButton);
        }

        if (this._collapseButton !== null) {
            turtlesStage.removeChild(this._collapseButton);
        }

        if (this._clearButton !== null) {
            turtlesStage.removeChild(this._clearButton);
        }

        if (this._gridButton !== null) {
            turtlesStage.removeChild(this._gridButton);
        }

        let circles = null;

        /**
         * Toggles visibility of menu and grids.
         * Scales down all 'turtles' in turtleList.
         * Removes the stage and adds it back at the top.
         */
        let __collapse = () => {
            this.hideMenu();
            this.hideGrids();
            this.setStageScale(0.25);
            this._collapsedBoundary.visible = true;
            this._expandButton.visible = true;
            this._expandedBoundary.visible = false;
            this._collapseButton.visible = false;
            turtlesStage.x = (this._w * 3) / 4 - 10;
            turtlesStage.y = 55 + LEADING + 6;
            this._isShrunk = true;

            for (let i = 0; i < this.turtleList.length; i++) {
                this.turtleList[i].container.scaleX = CONTAINERSCALEFACTOR;
                this.turtleList[i].container.scaleY = CONTAINERSCALEFACTOR;
                this.turtleList[i].container.scale = CONTAINERSCALEFACTOR;
            }

            this._clearButton.scaleX = CONTAINERSCALEFACTOR;
            this._clearButton.scaleY = CONTAINERSCALEFACTOR;
            this._clearButton.scale = CONTAINERSCALEFACTOR;
            this._clearButton.x = this._w - 5 - 8 * 55;

            if (this._gridButton !== null) {
                this._gridButton.scaleX = CONTAINERSCALEFACTOR;
                this._gridButton.scaleY = CONTAINERSCALEFACTOR;
                this._gridButton.scale = CONTAINERSCALEFACTOR;
                this._gridButton.x = this._w - 10 - 12 * 55;
                this._gridButton.visible = false;
            }

            // remove the stage and add it back at the top
            this.masterStage.removeChild(turtlesStage);
            this.masterStage.addChild(turtlesStage);

            this.refreshCanvas();
        }

        /**
         * Makes 'cartesian' button by initailising 'CARTESIANBUTTON' SVG.
         * Assigns click listener function to doGrid() method.
         */
        let __makeGridButton = () => {
            this._gridButton = new createjs.Container();
            this._gridLabel = null;
            this._gridLabelBG = null;

            this._gridButton.removeAllEventListeners("click");
            this._gridButton.on("click", event => {
                this.doGrid();
            });

            this._gridLabel = new createjs.Text(
                _("show Cartesian"),
                "14px Sans",
                "#282828"
            );
            this._gridLabel.textAlign = "center";
            this._gridLabel.x = 27.5;
            this._gridLabel.y = 55;
            this._gridLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                let bitmap = new createjs.Bitmap(img);
                this._gridButton.addChild(bitmap);
                this._gridButton.addChild(this._gridLabel);

                bitmap.visible = true;
                this._gridButton.x = this._w - 10 - 3 * 55;
                this._gridButton.y = 70 + LEADING + 6;
                this._gridButton.visible = true;

                // borderContainer.addChild(this._gridButton);
                turtlesStage.addChild(this._gridButton);
                this.refreshCanvas();

                this._gridButton.removeAllEventListeners("mouseover");
                this._gridButton.on("mouseover", event => {
                    if (this._gridLabel !== null) {
                        this._gridLabel.visible = true;

                        if (this._gridLabelBG === null) {
                            let b = this._gridLabel.getBounds();
                            this._gridLabelBG = new createjs.Shape();
                            this._gridLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._gridLabel.x + b.x - 8,
                                    this._gridLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._gridButton.addChildAt(this._gridLabelBG, 0);
                        } else {
                            this._gridLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._gridButton.x + 28,
                            this._gridButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            turtlesStage
                        );
                    }

                    this.refreshCanvas();
                });

                this._gridButton.removeAllEventListeners("mouseout");
                this._gridButton.on("mouseout", event => {
                    hideButtonHighlight(circles, turtlesStage);
                    if (this._gridLabel !== null) {
                        this._gridLabel.visible = false;
                        this._gridLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                if (doCollapse) {
                    __collapse();
                }

                this._locked = false;
                if (this._queue.length === 3) {
                    this._scale = this._queue[2];
                    this._w = this._queue[0] / this._scale;
                    this._h = this._queue[1] / this._scale;
                    this._queue = [];
                    this.makeBackground();
                }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CARTESIANBUTTON)));
        };

        /**
         * Makes clear button by initailising 'CLEARBUTTON' SVG.
         * Assigns click listener function to call doClear() method.
         */
        let __makeClearButton = () => {
            this._clearButton = new createjs.Container();
            this._clearLabel = null;
            this._clearLabelBG = null;

            this._clearButton.removeAllEventListeners("click");
            this._clearButton.on("click", event => {
                this.doClear();
            });

            this._clearLabel = new createjs.Text(
                _("Clean"),
                "14px Sans",
                "#282828"
            );
            this._clearLabel.textAlign = "center";
            this._clearLabel.x = 27.5;
            this._clearLabel.y = 55;
            this._clearLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                let bitmap = new createjs.Bitmap(img);
                this._clearButton.addChild(bitmap);
                this._clearButton.addChild(this._clearLabel);

                bitmap.visible = true;
                this._clearButton.x = this._w - 5 - 2 * 55;
                this._clearButton.y = 70 + LEADING + 6;
                this._clearButton.visible = true;

                // borderContainer.addChild(this._clearButton);
                turtlesStage.addChild(this._clearButton);
                this.refreshCanvas();

                this._clearButton.removeAllEventListeners("mouseover");
                this._clearButton.on("mouseover", event => {
                    if (this._clearLabel !== null) {
                        this._clearLabel.visible = true;

                        if (this._clearLabelBG === null) {
                            let b = this._clearLabel.getBounds();
                            this._clearLabelBG = new createjs.Shape();
                            this._clearLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._clearLabel.x + b.x - 8,
                                    this._clearLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._clearButton.addChildAt(this._clearLabelBG, 0);
                        } else {
                            this._clearLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._clearButton.x + 28,
                            this._clearButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            turtlesStage
                        );
                    }

                    this.refreshCanvas();
                });

                this._clearButton.removeAllEventListeners("mouseout");
                this._clearButton.on("mouseout", event => {
                    hideButtonHighlight(circles, turtlesStage);
                    if (this._clearLabel !== null) {
                        this._clearLabel.visible = false;
                    }

                    if (this._clearLabelBG !== null) {
                        this._clearLabelBG.visible = false;
                    }

                    this.refreshCanvas();
                });

                if (doCollapse) {
                    __collapse();
                }

                let language = localStorage.languagePreference;
                // if (!beginnerMode || language !== 'ja') {
                __makeGridButton();
                // }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CLEARBUTTON)));
        };

        /**
         * Makes collapse button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to call __collapse() method.
         */
        let __makeCollapseButton = () => {
            this._collapseButton = new createjs.Container();
            this._collapseLabel = null;
            this._collapseLabelBG = null;

            this._collapseLabel = new createjs.Text(
                _("Collapse"),
                "14px Sans",
                "#282828"
            );
            this._collapseLabel.textAlign = "center";
            this._collapseLabel.x = 11.5;
            this._collapseLabel.y = 55;
            this._collapseLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                if (this._collapseButton !== null) {
                    this._collapseButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                this._collapseButton.addChild(bitmap);
                bitmap.visible = true;
                this._collapseButton.addChild(this._collapseLabel);

                // borderContainer.addChild(this._collapseButton);
                turtlesStage.addChild(this._collapseButton);

                this._collapseButton.visible = true;
                this._collapseButton.x = this._w - 55;
                this._collapseButton.y = 70 + LEADING + 6;
                this.refreshCanvas();

                this._collapseButton.removeAllEventListeners("click");
                this._collapseButton.on("click", event => {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    __collapse();
                });

                this._collapseButton.removeAllEventListeners("mouseover");
                this._collapseButton.on("mouseover", event => {
                    if (this._collapseLabel !== null) {
                        this._collapseLabel.visible = true;

                        if (this._collapseLabelBG === null) {
                            let b = this._collapseLabel.getBounds();
                            this._collapseLabelBG = new createjs.Shape();
                            this._collapseLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._collapseLabel.x + b.x - 8,
                                    this._collapseLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._collapseButton.addChildAt(
                                this._collapseLabelBG,
                                0
                            );
                        } else {
                            this._collapseLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._collapseButton.x + 28,
                            this._collapseButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            turtlesStage
                        );
                    }

                    this.refreshCanvas();
                });

                this._collapseButton.removeAllEventListeners("mouseout");
                this._collapseButton.on("mouseout", event => {
                    hideButtonHighlight(circles, turtlesStage);
                    if (this._collapseLabel !== null) {
                        this._collapseLabel.visible = false;
                        this._collapseLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                __makeClearButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(COLLAPSEBUTTON)));
        };

        /**
         * Makes expand button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to remove stage and add it at posiion 0.
         */
        let __makeExpandButton = () => {
            this._expandButton = new createjs.Container();
            this._expandLabel = null;
            this._expandLabelBG = null;

            this._expandLabel = new createjs.Text(
                _("Expand"),
                "14px Sans",
                "#282828"
            );
            this._expandLabel.textAlign = "center";
            this._expandLabel.x = 11.5;
            this._expandLabel.y = 55;
            this._expandLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                if (this._expandButton !== null) {
                    this._expandButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                this._expandButton.addChild(bitmap);
                bitmap.visible = true;
                this._expandButton.addChild(this._expandLabel);

                this._expandButton.x = this._w - 10 - 4 * 55;
                this._expandButton.y = 70 + LEADING + 6;
                this._expandButton.scaleX = CONTAINERSCALEFACTOR;
                this._expandButton.scaleY = CONTAINERSCALEFACTOR;
                this._expandButton.scale = CONTAINERSCALEFACTOR;
                this._expandButton.visible = false;
                // borderContainer.addChild(this._expandButton);
                turtlesStage.addChild(this._expandButton);

                this._expandButton.removeAllEventListeners("mouseover");
                this._expandButton.on("mouseover", event => {
                    if (this._expandLabel !== null) {
                        this._expandLabel.visible = true;

                        if (this._expandLabelBG === null) {
                            let b = this._expandLabel.getBounds();
                            this._expandLabelBG = new createjs.Shape();
                            this._expandLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._expandLabel.x + b.x - 8,
                                    this._expandLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._expandButton.addChildAt(
                                this._expandLabelBG,
                                0
                            );
                        } else {
                            this._expandLabelBG.visible = true;
                        }
                    }

                    this.refreshCanvas();
                });

                this._expandButton.removeAllEventListeners("mouseout");
                this._expandButton.on("mouseout", event => {
                    if (this._expandLabel !== null) {
                        this._expandLabel.visible = false;
                        this._expandLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                this._expandButton.removeAllEventListeners("pressmove");
                this._expandButton.on("pressmove", event => {
                    let w = (this._w - 10 - CONTAINERSCALEFACTOR * 55) / CONTAINERSCALEFACTOR;
                    let x = event.stageX / this._scale - w;
                    let y = event.stageY / this._scale - 16;
                    turtlesStage.x = Math.max(0, Math.min((this._w * 3) / 4, x));
                    turtlesStage.y = Math.max(55, Math.min((this._h * 3) / 4, y));
                    this.refreshCanvas();
                });

                this._expandButton.removeAllEventListeners("click");
                this._expandButton.on("click", event => {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    this.hideMenu();
                    this.setStageScale(1.0);
                    this._expandedBoundary.visible = true;
                    this._collapseButton.visible = true;
                    this._collapsedBoundary.visible = false;
                    this._expandButton.visible = false;
                    turtlesStage.x = 0;
                    turtlesStage.y = 0;
                    this._isShrunk = false;

                    for (let i = 0; i < this.turtleList.length; i++) {
                        this.turtleList[i].container.scaleX = 1;
                        this.turtleList[i].container.scaleY = 1;
                        this.turtleList[i].container.scale = 1;
                    }

                    this._clearButton.scaleX = 1;
                    this._clearButton.scaleY = 1;
                    this._clearButton.scale = 1;
                    this._clearButton.x = this._w - 5 - 2 * 55;

                    if (this._gridButton !== null) {
                        this._gridButton.scaleX = 1;
                        this._gridButton.scaleY = 1;
                        this._gridButton.scale = 1;
                        this._gridButton.x = this._w - 10 - 3 * 55;
                        this._gridButton.visible = true;
                    }

                    // remove the stage and add it back in position 0
                    this.masterStage.removeChild(turtlesStage);
                    this.masterStage.addChildAt(turtlesStage, 0);
                });

                __makeCollapseButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(EXPANDBUTTON)));
        };

        /**
         * Makes second boundary for graphics (mouse) container by initialising 'MBOUNDARY' SVG.
         */
        let __makeBoundary2 = () => {
            let img = new Image();
            img.onload = () => {
                if (this._collapsedBoundary !== null) {
                    this._collapsedBoundary.visible = false;
                }

                this._collapsedBoundary = new createjs.Bitmap(img);
                this._collapsedBoundary.x = 0;
                this._collapsedBoundary.y = 55 + LEADING;
                borderContainer.addChild(this._collapsedBoundary);
                this._collapsedBoundary.visible = false;

                __makeExpandButton();
            };

            let dx = this._w - 20;
            let dy = this._h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this._h)
                                .replace("WIDTH", this._w)
                                .replace("Y", 10)
                                .replace("X", 10)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this._backgroundColor)
                                .replace("STROKE", 20)
                        )
                    )
                );
        };

        /**
         * Makes boundary for graphics (mouse) container by initialising
         * 'MBOUNDARY' SVG.
         */
        let __makeBoundary = () => {
            this._locked = true;
            let img = new Image();
            img.onload = () => {
                if (this._expandedBoundary !== null) {
                    this._expandedBoundary.visible = false;
                }

                this._expandedBoundary = new createjs.Bitmap(img);
                this._expandedBoundary.x = 0;
                this._expandedBoundary.y = 55 + LEADING;
                borderContainer.addChild(this._expandedBoundary);
                __makeBoundary2();
            };

            let dx = this._w - 5;
            let dy = this._h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this._h)
                                .replace("WIDTH", this._w)
                                .replace("Y", 10 / CONTAINERSCALEFACTOR)
                                .replace("X", 10 / CONTAINERSCALEFACTOR)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this._backgroundColor)
                                .replace("STROKE", 20 / CONTAINERSCALEFACTOR)
                        )
                    )
                );
        };

        if (!this._locked) {
            __makeBoundary();
        }

        return this;
    }
};
