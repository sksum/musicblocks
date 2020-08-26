/**
 * @file This contains the utilities for generating the Abstract Syntax Tree for JavaScript based
 * Music Blocks code.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 *
 * The Abstract Syntax Trees are in ESTree specification.
*/

/** list of clamp block names */
const clampBlocks = [
    // Rhythm blocks
    "newnote",
    "osctime",
    "rhythmicdot2",
    "tie",
    "multiplybeatfactor",
    "newswing2",
    // Meter blocks
    "drift",
    // Pitch blocks
    "accidental",
    "setscalartransposition",
    "settransposition",
    "invert1",
    // Intervals blocks
    "definemode",
    "interval",
    "semitoneinterval",
    // Tone blocks
    "settimbre",
    "vibrato",
    "chorus",
    "phaser",
    "tremolo",
    "dis",
    "harmonic2",
    // Ornament blocks
    "newstaccato",
    "newslur",
    "neighbor2",
    // Volume blocks
    "crescendo",
    "decrescendo",
    "articulation",
    // Drum blocks
    "setdrum",
    "mapdrum"
];

/** lookup table for block names to setter names */
const setterNameLookup = {
        // Meter blocks
    "pickup": "PICKUP",
        // Intervals blocks
    "movable": "MOVEABLE",
        // Volume blocks
    "setnotevolume": "MASTERVOLUME",
    "setpanning": "PANNING",
};

/** lookup table for block names to getter names */
const getterNameLookup = {
        // Rhythm blocks
    "mynotevalue": "NOTEVALUE",
        // Meter blocks
    "elapsednotes": "WHOLENOTESPLAYED",
    "beatvalue": "BEATCOUNT",
    "measurevalue": "MEASURECOUNT",
    "bpmfactor": "BPM",
    "beatfactor": "BEATFACTOR",
    "currentmeter": "CURRENTMETER",
        // Pitch blocks
    "deltapitch2": "SCALARCHANGEINPITCH",
    "deltapitch": "CHANGEINPITCH",
    "consonantstepsizeup": "SCALARSTEPUP",
    "consonantstepsizedown": "SCALARSTEPDOWN",
        // Intervals blocks
    "key": "CURRENTKEY",
    "currentmode": "CURRENTMODE",
    "modelength": "MODELENGTH",
        // Volume blocks
    "notevolumefactor": "MASTERVOLUME"
};

/** lookup table for block names to API method names */
const methodNameLookup = {
        // Rhythm blocks
    "newnote": "playNote",
    "osctime": "playNoteMillis",
    "rest2": "playRest",
    "rhythmicdot2": "dot",
    "tie": "tie",
    "multiplybeatfactor": "multiplyNoteValue",
    "newswing2": "swing",
        // Meter blocks
    "meter": "setMeter",
    "setbpm3": "setBPM",
    "setmasterbpm2": "setMasterBPM",
    "everybeatdo": "onEveryNoteDo",
    "everybeatdonew": "onEveryBeatDo",
    "onbeatdo": "onStrongBeatDo",
    "offbeatdo": "onWeakBeatDo",
    "drift": "setNoClock",
    "elapsednotes2": "getNotesPlayed",
        // Pitch blocks
    "pitch": "playPitch",
    "steppitch": "stepPitch",
    "nthmodalpitch": "playNthModalPitch",
    "pitchnumber": "playPitchNumber",
    "hertz": "playHertz",
    "accidental": "setAccidental",
    "setscalartransposition": "setScalarTranspose",
    "settransposition": "setSemitoneTranspose",
    "register": "setRegister",
    "invert1": "invert",
    "setpitchnumberoffset": "setPitchNumberOffset",
    "number2pitch": "numToPitch",
    "number2octave": "numToOctave",
        // Intervals blocks
    "setkey2": "setKey",
    // "definemode": "defineMode",
    "interval": "setScalarInterval",
    "semitoneinterval": "setSemitoneInterval",
    "settemperament": "setTemperament",
        // Tone blocks
    "settimbre": "setInstrument",
    "vibrato": "doVibrato",
    "chorus": "doChorus",
    "phaser": "doPhaser",
    "tremolo": "doTremolo",
    "dis": "doDistortion",
    "harmonic2": "doHarmonic",
        // Ornament blocks
    "newstaccato": "setStaccato",
    "newslur": "setSlur",
    "neighbor2": "doNeighbor",
        // Volume blocks
    "crescendo": "doCrescendo",
    "decrescendo": "doDecrescendo",
    "articulation": "setRelativeVolume",
    "setsynthvolume": "setSynthVolume",
    "synthvolumefactor": "getSynthVolume",
        // Drum blocks
    "playdrum": "playDrum",
    "setdrum": "setDrum",
    "mapdrum": "mapPitchToDrum",
    "playnoise": "playNoise",
    // Number blocks
    "random": "MathUtility.doRandom",
    "oneOf": "MathUtility.doOneOf",
    "distance": "MathUtility.doCalculateDistance",
    // Graphics blocks
    "forward": "doForward",
    "back": "doForward",
    "right": "doRight",
    "left": "doRight",
    "setxy": "doSetXY",
    "setheading": "doSetHeading",
    "arc": "doArc",
    "bezier": "doBezier",
    "controlpoint1": "setControlPoint1",
    "controlpoint2": "setControlPoint2",
    "clear": "doClear",
    "scrollxy": "doScrollXY",
    // Pen blocks
    "setcolor": "doSetColor",
    "setgrey": "doSetChroma",
    "setshade": "doSetValue",
    "sethue": "doSetHue",
    "settranslucency": "doSetPenAlpha",
    "setpensize": "doSetPensize",
    "penup": "doPenUp",
    "pendown": "doPenDown",
    // "": "doStartFill",
    // "": "doStartHollowLine",
    // "": "fillBackground",
    "setfont": "doSetFont"
};

/** Abstract Syntax Tree for the bare minimum program code */
const bareboneAST = {
    "type": "Program",
    "sourceType": "script",
    "body": [
        {
            "type": "ExpressionStatement",
            "expression": {
              "type": "CallExpression",
              "callee": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "MusicBlocks"
                },
                "computed": false,
                "property": {
                  "type": "Identifier",
                  "name": "run"
                }
              },
              "arguments": []
            }
          }
    ]
};

/** Abstract Syntax Tree for the bare minimum mouse code */
const mouseAST = {
    "type": "ExpressionStatement",
    "expression": {
        "type": "NewExpression",
        "callee": {
            "type": "Identifier",
            "name": "Mouse"
        },
        "arguments": [
            {
                "type": "ArrowFunctionExpression",
                "params": [
                    {
                        "type": "Identifier",
                        "name": "mouse"
                    }
                ],
                "body": {
                    "type": "BlockStatement",
                    "body": [
                        {
                            "type": "ReturnStatement",
                            "argument": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "mouse"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "ENDMOUSE"
                                }
                            }
                        }
                    ]
                },
                "async": true,
                "expression": false
            }
        ]
    }
};

/**
 * Returns the Abstract Syntax tree for a setter statement.
 *
 * @param {String} identifier - identifier name
 * @param {[*]} - tree of arguments
 * @returns {Object} Abstract Syntax Tree of getter
 */
function getSetAST(identifier, args) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "left": {
                "type": "MemberExpression",
                "object": {
                    "type": "Identifier",
                    "name": "mouse"
                },
                "computed": false,
                "property": {
                    "type": "Identifier",
                    "name": `${identifier}`
                }
            },
            "operator": "=",
            "right": getArgsAST(args)[0]
        }
    };
}

/**
 * Returns the Abstract Syntax tree for a getter statement.
 *
 * @param {String} identifier - identifier name
 * @returns {Object} Abstract Syntax Tree of getter
 */
function getGetAST(identifier) {
    return {
        "type": "MemberExpression",
        "object": {
            "type": "Identifier",
            "name": "mouse"
        },
        "computed": false,
        "property": {
            "type": "Identifier",
            "name": `${identifier}`
        }
    };
}

/**
 * Returns the Abstract Syntax tree for an if/if-else block.
 *
 * @param {[*]} args - tree of arguments (for test argument)
 * @param {[*]} ifFlow - tree of flow statements for if condition
 * @param {[*]} [elseFlow] - tree of flow statements for else condition
 * @returns {Object} Abstract Syntax Tree of if/if-else block
 */
function getIfAST(args, ifFlow, elseFlow) {
    let AST = {
        "type": "IfStatement",
        "test": getArgsAST(args)[0],
        "consequent": {
            "type": "BlockStatement",
            "body": getBlockAST(ifFlow)
        },
        "alternate": null
    };

    if (elseFlow !== undefined) {
        AST["alternate"] = {
            "type": "BlockStatement",
            "body": getBlockAST(elseFlow)
        }
    }

    return AST;
}

/**
 * Returns the Abstract Syntax tree for a for-loop block.
 *
 * @param {[*]} args - tree of arguments (for repeat limit)
 * @param {[*]} flow - tree of flow statements
 * @param {Number} iteratorNum - iterator index number
 * @returns {Object} Abstract Syntax Tree of for-loop
 */
function getForLoopAST(args, flow, iteratorNum) {
    if (iteratorNum === undefined)
        iteratorNum = 0;

    return {
        "type": "ForStatement",
        "init": {
            "type": "VariableDeclaration",
            "kind": "let",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "i" + iteratorNum
                    },
                    "init": {
                        "type": "Literal",
                        "value": 0
                    }
                }
            ]
        },
        "test": {
            "type": "BinaryExpression",
            "left": {
                "type": "Identifier",
                "name": "i" + iteratorNum
            },
            "right": getArgsAST(args)[0],
            "operator": "<"
        },
        "update": {
            "type": "UpdateExpression",
            "argument": {
                "type": "Identifier",
                "name": "i" + iteratorNum
            },
            "operator": "++",
            "prefix": false
        },
        "body": {
            "type": "BlockStatement",
            "body": getBlockAST(flow, iteratorNum + 1)
        }
    };
}

/**
 * Returns the Abstract Syntax tree for a while-loop block.
 *
 * @param {[*]} args - tree of arguments (for test condition)
 * @param {[*]} flow - tree of flow statements
 * @returns {Object} Abstract Syntax Tree of while-loop
 */
function getWhileLoopAST(args, flow) {
    return {
        "type": "WhileStatement",
        "test": getArgsAST(args)[0],
        "body": {
            "type": "BlockStatement",
            "body": getBlockAST(flow)
        }
    };
}

/**
 * Returns the Abstract Syntax tree for a do-while-loop block.
 *
 * @param {[*]} args - tree of arguments (for test condition)
 * @param {[*]} flow - tree of flow statements
 * @returns {Object} Abstract Syntax Tree of do-while-loop
 */
function getDoWhileLoopAST(args, flow) {
    return {
        "type": "DoWhileStatement",
        "body": {
            "type": "BlockStatement",
            "body": getBlockAST(flow)
        },
        "test": getArgsAST(args)[0]
    };
}

/**
 * Returns the Abstract Syntax Tree for an increment assignment statement.
 *
 * @param {[*]} args - list of identifier and tree of arguments
 * @param {Boolean} isIncrement - whether increment statement
 * @returns {Object} Abstract Syntax Tree of increment assignment statement
 */
function getIncrementStmntAST(args, isIncrement) {
    let identifier = args[0].split("_")[1];
    let arg = getArgsAST([args[1]])[0];

    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AssignmentExpression",
            "left": {
                "type": "Identifier",
                "name": identifier
            },
            "operator": "=",
            "right": {
                "type": "BinaryExpression",
                "left": {
                    "type": "Identifier",
                    "name": identifier
                },
                "right": arg,
                "operator": isIncrement ? "+" : "-"
            }
        }
    };
}

/**
 * Returns the Abstract Syntax Tree for the bare minimum method defintion code
 *
 * @param {String} methodName - method name
 * @returns {Object} Abstract Syntax Tree for method definition
 */
function getMethodDefAST(methodName) {
    return {
        "type": "VariableDeclaration",
        "kind": "let",
        "declarations": [
            {
                "type": "VariableDeclarator",
                "id": {
                    "type": "Identifier",
                    "name": `${methodName}`
                },
                "init": {
                    "type": "ArrowFunctionExpression",
                    "params": [
                        {
                            "type": "Identifier",
                            "name": "mouse"
                        }
                    ],
                    "body": {
                        "type": "BlockStatement",
                        "body": [
                            {
                                "type": "ReturnStatement",
                                "argument": {
                                    "type": "MemberExpression",
                                    "object": {
                                        "type": "Identifier",
                                        "name": "mouse"
                                    },
                                    "computed": false,
                                    "property": {
                                        "type": "Identifier",
                                        "name": "ENDFLOW"
                                    }
                                }
                            }
                        ]
                    },
                    "async": true,
                    "expression": false
                }
            }
        ]
    };
}

/**
 * Returns the Abstract Syntax Tree for a method call without function argument.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @param {Boolean} isAction - whether method call is an action call
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getMethodCallAST(methodName, args, isAction) {
    let AST = {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AwaitExpression",
            "argument": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "object": {
                        "type": "Identifier",
                        "name": "mouse"
                    },
                    "computed": false,
                    "property": {
                        "type": "Identifier",
                        "name": `${methodName}`
                    }
                },
                "arguments": getArgsAST(args)
            }
        }
    };

    if (isAction) {
        AST["expression"]["argument"]["callee"] = {
            "type": "Identifier",
            "name": `${methodName}`
        };
        AST["expression"]["argument"]["arguments"] = [
            {
              "type": "Identifier",
              "name": "mouse"
            }
        ];
    }

    return AST;
}

/**
 * Returns the Abstract Syntax Tree for a method call in arguments.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getArgExpAST(methodName, args) {
    const mathOps = {
        "plus": ["binexp", "+"],
        "minus": ["binexp", "-"],
        "multiply": ["binexp", "*"],
        "divide": ["binexp", "/"],
        "mod": ["binexp", "%"],
        "equal": ["binexp", "=="],
        "less": ["binexp", "<"],
        "greater": ["binexp", ">"],
        "or": ["binexp", "|"],
        "and": ["binexp", "&"],
        "xor": ["binexp", "^"],
        "not": ["unexp", "!"],
        "neg": ["unexp", "-"],
        "abs": ["method", "Math.abs"],
        "sqrt": ["method", "Math.sqrt"],
        "power": ["method", "Math.pow"],
        "int": ["method", "Math.floor"]
    };

    function getBinaryExpAST(operator, operand1, operand2) {
        return {
            "type": "BinaryExpression",
            "left": getArgsAST([operand1])[0],
            "right": getArgsAST([operand2])[0],
            "operator": `${operator}`
        };
    }

    function getUnaryExpAST(operator, operand) {
        return {
            "type": "UnaryExpression",
            "operator": `${operator}`,
            "argument": getArgsAST([operand])[0],
            "prefix": true
        };
    }

    function getCallExpAST(methodName, args) {
        return {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": `${methodName}`
            },
            "arguments": getArgsAST(args)
        };
    }

    if (methodName in mathOps) {
        if (mathOps[methodName][0] === "binexp") {
            return getBinaryExpAST(mathOps[methodName][1], ...args);
        } else if (mathOps[methodName][0] === "unexp") {
            return getUnaryExpAST(mathOps[methodName][1], args[0]);
        } else {
            return getCallExpAST(mathOps[methodName][1], args);
        }
    } else {
        return getCallExpAST(methodName, args);
    }
}

/**
 * Returns list of Abstract Syntax Trees corresponding to each argument of args.
 *
 * @param {[*]} args - tree of arguments
 * @returns {[Object]} list of Abstract Syntax Trees
 */
function getArgsAST(args) {
    if (args === undefined || args === null)
        return [];

    let ASTs = [];
    for (let arg of args) {
        if (arg === null) {
            ASTs.push({
                "type": "Literal",
                "value": null
            });
        } else if (typeof arg === "object") {
            if (arg[0] in getterNameLookup) {
                ASTs.push(getGetAST(getterNameLookup[arg[0]]));
            } else {
                ASTs.push(getArgExpAST(arg[0], arg[1]));
            }
        } else {
            if (typeof arg === "string" && arg.split("_").length > 1) {
                let [type, argVal] = arg.split("_");
                if (type === "bool") {
                    ASTs.push({
                        "type": "Literal",
                        "value": argVal === "true"
                    });
                } else if (type === "box") {
                    ASTs.push({
                        "type": "Identifier",
                        "name": argVal
                    });
                }
            } else {
                ASTs.push({
                    "type": "Literal",
                    "value": arg
                });
            }
        }
    }

    return ASTs;
}

/**
 * Returns the Abstract Syntax Tree for a method call with function argument.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @param {[*]} flows - tree of flow statements
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getMethodCallClampAST(methodName, args, flows) {
    let AST = getMethodCallAST(methodName, args);

    AST["expression"]["argument"]["arguments"].push({
        "type": "ArrowFunctionExpression",
        "params": [],
        "body": {
            "type": "BlockStatement",
            "body": getBlockAST(flows)
        },
        "async": true,
        "expression": false
    });

    last(AST["expression"]["argument"]["arguments"])["body"]["body"].push({
        "type": "ReturnStatement",
        "argument": {
            "type": "MemberExpression",
            "object": {
                "type": "Identifier",
                "name": "mouse"
            },
            "computed": false,
            "property": {
                "type": "Identifier",
                "name": "ENDFLOW"
            }
        }
    });

    return AST;
}

/**
 * Returns list of Abstract Syntax Trees corresponding to each flow statement.
 *
 * @param {[*]} flows - tree of flow statements
 * @param {Number} hiIteratorNum - highest iterator number in block
 * @returns {[Object]} list of Abstract Syntax Trees
 * @throws {String} INVALID BLOCK Error
 */
function getBlockAST(flows, hiIteratorNum) {
    if (flows === undefined || flows === null)
        return [];

    let ASTs = [];
    for (let flow of flows) {
        if (flow[0] === "if") {
            ASTs.push(getIfAST(flow[1], flow[2]));
        } else if (flow[0] === "ifthenelse") {
            ASTs.push(getIfAST(flow[1], flow[2], flow[3]));
        } else if (flow[0] === "repeat") {
            ASTs.push(getForLoopAST(flow[1], flow[2], hiIteratorNum));
        } else if (flow[0] === "while") {
            ASTs.push(getWhileLoopAST(flow[1], flow[2]));
        } else if (flow[0] === "forever") {
            ASTs.push(getWhileLoopAST([true], flow[2]));
        } else if (flow[0] === "until") {
            ASTs.push(getDoWhileLoopAST(flow[1], flow[2]));
        } else if (flow[0] === "break") {
            ASTs.push({
                "type": "BreakStatement",
                "label": null
            });
        } else if (flow[0] === "switch") {
            ASTs.push({
                "type": "SwitchStatement",
                "discriminant": getArgsAST(flow[1])[0],
                "cases": getBlockAST(flow[2])
            });
        } else if (flow[0] === "case") {
            let AST = {
                "type": "SwitchCase",
                "test": getArgsAST(flow[1])[0],
                "consequent": [
                    {
                        "type": "BreakStatement",
                        "label": null
                    }
                ]
            };

            let flowASTs = getBlockAST(flow[2]);
            for (let i in flowASTs) {
                AST["consequent"].splice(i, 0, flowASTs[i]);
            }

            ASTs.push(AST);
        } else if (flow[0] === "defaultcase") {
            ASTs.push({
                "type": "SwitchCase",
                "test": null,
                "consequent": getBlockAST(flow[2])
            });
        } else if (flow[0] === "increment") {
            ASTs.push(getIncrementStmntAST(flow[1], true));
        } else if (flow[0] === "incrementOne") {
            ASTs.push(getIncrementStmntAST([flow[1][0], 1], true));
        } else if (flow[0] === "decrementOne") {
            ASTs.push(getIncrementStmntAST([flow[1][0], 1], false));
        } else if (flow[0].split("_").length > 1) {
            let [instruction, idName] = flow[0].split("_");
            if (instruction === "storein2") {
                ASTs.push({
                    "type": "VariableDeclaration",
                    "kind": "let",
                    "declarations": [
                        {
                            "type": "VariableDeclarator",
                            "id": {
                                "type": "Identifier",
                                "name": idName
                            },
                            "init": getArgsAST(flow[1])[0]
                        }
                    ]
                });
            } else if (instruction === "nameddo") {
                ASTs.push(getMethodCallAST(idName, flow[1], true));
            }
        } else {
            if (flow[0] in setterNameLookup) {
                ASTs.push(getSetAST(setterNameLookup[flow[0]], flow[1]));
            } else if (flow[0] in methodNameLookup) {
                let isClamp = clampBlocks.indexOf(flow[0]) !== -1;
                flow[0] = methodNameLookup[flow[0]];
                if (isClamp) {                                  // has inner flow
                    ASTs.push(getMethodCallClampAST(...flow));
                } else {                                        // no inner flow
                    ASTs.push(getMethodCallAST(...flow));
                }
            } else {
                if (flow[0] === "print") {
                    ASTs.push({
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "console"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "log"
                                }
                            },
                            "arguments": getArgsAST(flow[1])
                        }
                    });
                } else {
                    throw `CANNOT PROCESS "${flow[0]}" BLOCK`;
                }
            }
        }
    }

    return ASTs;
}

/**
 * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
 *
 * @param {String} methodName - method name
 * @param {[*]} tree - stacks tree for the mouse
 * @returns {Object} mouse Abstract Syntax Tree for the tree
 */
function getMethodAST(methodName, tree) {
    let AST = getMethodDefAST(methodName);

    let ASTs = getBlockAST(tree);
    for (let i in ASTs) {
        AST["declarations"][0]["init"]["body"]["body"].splice(i, 0, ASTs[i]);
    }

    return AST;
}

/**
 * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
 *
 * @param {[*]} tree - stacks tree for the mouse
 * @returns {Object} mouse Abstract Syntax Tree for the tree
 */
function getMouseAST(tree) {
    let AST = JSON.parse(JSON.stringify(mouseAST));

    let ASTs = getBlockAST(tree);
    for (let i in ASTs) {
        AST["expression"]["arguments"][0]["body"]["body"].splice(i, 0, ASTs[i]);
    }

    return AST;
}
