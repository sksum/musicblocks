function _getDict(target, logo, turtle, k) {
    // This is the internal turtle dictionary that
    // includes the turtle status.
    if (k === _('color')) {
        return logo.turtles.turtleList[target].painter.color;
    } else if (k === _('shade')) {
        return logo.turtles.turtleList[target].painter.value;
    } else if (k === _('grey')) {
        return logo.turtles.turtleList[target].painter.chroma;
    } else if (k === _('pen size')) {
        return logo.turtles.turtleList[target].painter.pensize;
    } else if (k === _('font')) {
        return logo.turtles.turtleList[target].painter.font;
    } else if (k === _('heading')) {
        return logo.turtles.turtleList[target].painter.heading;
    } else if (k === "x") {
        return logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
    } else if (k === "y") {
        return logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
    } else if (k === _('notes played')) {
        return logo.turtles.turtleList[target].singer.notesPlayed[0] / logo.turtles.turtleList[target].singer.notesPlayed[1];
    } else if (k === _('note value')) {
        return Singer.RhythmActions.getNoteValue(target);
    } else if (k === _('current pitch')) {
        return logo.turtles.turtleList[target].singer.lastNotePlayed[0];
    } else if (k === _('pitch number')) {
        let thisTurtle = logo.turtles.turtleList[target];
        let obj;
        if (thisTurtle.singer.lastNotePlayed !== null) {
            let len = thisTurtle.singer.lastNotePlayed[0].length;
            let pitch = thisTurtle.singer.lastNotePlayed[0].slice(0, len - 1);
            let octave = parseInt(thisTurtle.singer.lastNotePlayed[0].slice(len - 1));

            obj = [pitch, octave];
        } else if (thisTurtle.singer.notePitches.length > 0) {
            obj = getNote(
                thisTurtle.singer.notePitches[0],
                thisTurtle.singer.noteOctaves[0],
                0,
                thisTurtle.singer.keySignature,
                tur.singer.moveable,
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
        } else {
            console.debug("Cannot find a note for mouse " + target);
            logo.errorMsg(INVALIDPITCH, blk);
            obj = ["G", 4];
        }

        return pitchToNumber(obj[0], obj[1], thisTurtle.singer.keySignature) - thisTurtle.singer.pitchNumberOffset;
    } else {
        if (target in logo.turtleDicts[turtle]) {
            return logo.turtleDicts[turtle][target][k];
        }
    }
    return 0;
}


function setDictValue(target, logo, turtle, k, v) {
    // This is the internal turtle dictionary that
    // includes the turtle status.
    if (k === _('color')) {
        logo.turtles.turtleList[target].painter.doSetColor(v);
    } else if (k === _('shade')) {
        logo.turtles.turtleList[target].painter.doSetValue(v);
    } else if (k === _('grey')) {
        logo.turtles.turtleList[target].painter.doSetChroma(v);
    } else if (k === _('pen size')) {
        logo.turtles.turtleList[target].painter.doSetPensize(v);
    } else if (k === _('font')) {
        logo.turtles.turtleList[target].painter.doSetFont(v);
    } else if (k === _('heading')) {
        logo.turtles.turtleList[target].painter.doSetHeading(v);
    } else if (k === "y") {
        let x = logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
        logo.turtles.turtleList[target].painter.doSetXY(x, v);
    } else if (k === "x") {
        let y = logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
        logo.turtles.turtleList[target].painter.doSetXY(v, y);
    } else {
        if (!(target in logo.turtleDicts[turtle])) {
            logo.turtleDicts[turtle][target] = {};
        }
        logo.turtleDicts[turtle][target][k] = v;
    }
    return;
}


function _serializeDict(target, logo, turtle) {
    // This is the internal turtle dictionary that includes the turtle
    // status.
    let this_dict = {};
    this_dict[_('color')] = logo.turtles.turtleList[target].painter.color;
    this_dict[_('shade')] = logo.turtles.turtleList[target].painter.value;
    this_dict[_('grey')] = logo.turtles.turtleList[target].painter.chroma;
    this_dict[_('pen size')] = logo.turtles.turtleList[target].painter.stroke;
    this_dict[_('font')] = logo.turtles.turtleList[target].painter.font;
    this_dict[_('heading')] = logo.turtles.turtleList[target].painter.orientation;
    this_dict["y"] = logo.turtles.screenY2turtleY(logo.turtles.turtleList[target].container.y);
    this_dict["x"] = logo.turtles.screenX2turtleX(logo.turtles.turtleList[target].container.x);
    if (target in logo.turtleDicts[turtle]) {
        for(let k in logo.turtleDicts[turtle][target]) {
            this_dict[k] = logo.turtleDicts[turtle][target][k];
        }
    }
    return JSON.stringify(this_dict);
}


function setupDictBlocks() {
    class ShowDictBlock extends FlowBlock {
        constructor() {
            super("showDict");
            this.setPalette("dictionary");
	    this.hidden = this.deprecated = true;
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Show-dictionary block displays the contents of the dictionary at the top of the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: Display the dictionary contents
                name: _("show dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        flow(args, logo, turtle, receivedArg) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let a = args[0];
            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                logo.textMsg(_serializeDict(target, logo, turtle));
                return;
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            logo.textMsg(JSON.stringify(logo.turtleDicts[turtle][a]));
        }
    }

    class DictBlock extends LeftBlock {
        constructor() {
            super("dictionary");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Dictionary block returns a dictionary."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                logo.turtleDicts[turtle] = {};
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return _serializeDict(target, logo, turtle);
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            return JSON.stringify(logo.turtleDicts[turtle][a]);
        }
    }

    class GetDictBlock extends LeftBlock {
        constructor() {
            super("getDict");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Get-dict block returns a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            labels: [this.lang === "js" ? _("do2") : _("do")]
            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            let k = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return _getDict(target, logo, turtle, k);
            } else if (!(a in logo.turtleDicts[turtle])) {
                return 0;
            }

            return logo.turtleDicts[turtle][a][k];
        }
    }

    class SetDictBlock extends FlowBlock {
        constructor() {
            super("setDict");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set-dict block sets a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 3,
                argTypes: ["anyin", "anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key"), 0]
            });
        }

        flow(args, logo, turtle, receivedArg) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[2] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let a = args[0];
            let k = args[1];
            let v = args[2];

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                setDictValue(target, logo, turtle, k, v);
                return;
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            logo.turtleDicts[turtle][a][k] = v;
        }

        return;
    }

    class GetDictBlock2 extends LeftBlock {
        constructor() {
            super("getDict2");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Get-dict block returns a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [this.lang === "ja" ? _("key2") : _("key")]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = logo.turtles.turtleList[turtle].name;
            let k = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                return _getDict(target, logo, turtle, k);
            } else if (!(a in logo.turtleDicts[turtle])) {
                return 0;
            }

            return logo.turtleDicts[turtle][a][k];
        }
    }

    class SetDictBlock2 extends FlowBlock {
        constructor() {
            super("setDict2");
            this.setPalette("dictionary");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Set-dict block sets a value in the dictionary for a specified key."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [this.lang === "ja" ? _("key2") : _("key"), 0]
            });
        }

        flow(args, logo, turtle, receivedArg) {
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            if (args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            let a = logo.turtles.turtleList[turtle].name;
            let k = args[0];
            let v = args[1];

            // Not sure this can happen.
            if (!(turtle in logo.turtleDicts)) {
                return 0;
            }
            // Is the dictionary the same as a turtle name?
            let target = getTargetTurtle(logo.turtles, a);
            if (target !== null) {
                setDictValue(target, logo, turtle, k, v);
                return;
            } else if (!(a in logo.turtleDicts[turtle])) {
                logo.turtleDicts[turtle][a] = {};
            }

            logo.turtleDicts[turtle][a][k] = v;
        }

        return;
    }

    new DictBlock().setup();
    new ShowDictBlock().setup();
    new SetDictBlock().setup();
    new GetDictBlock().setup();
    new SetDictBlock2().setup();
    new GetDictBlock2().setup();
}
