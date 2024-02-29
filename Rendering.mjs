import {
    canvasWidth, canvasHeight, totalChunkSize, blockSize, chunks, keys,
    chunkSize, canvasWidthInChunks, canvasHeightInChunks, entities, keysPressed, mouse,
    itemEntitySize, camera, itemIcons, consoleLog, canvas, ctx, showLoadingProgress, images
} from "./GlobalVariables.mjs";
showLoadingProgress("loading Rendering.mjs");


import {
    generateChunkTerrain, runBlockUpdatesAfterGeneration,
    generateChunkStructures, findBlock
} from "./Worldgen.mjs";
import { player } from "./Player.mjs";



/*
huge rework needed here, probably just delete most of the code, besides the Math i suppose




renderData, how stuff should be rendered
{   first thing accessed should be drawType, if it's none, do not do anything else
    "drawType": "none",
    next should be position, [x, y]
    "position": [x, y],
    then size (width/height)
    "size": [width, height],
    and a dict that contains specified stylings for stuff, which has to be name exact with the context
    properties
    "drawStyles" {
        all should have this
        "globalAlpha": self explanatory
        if the drawType was fill rect
        "fillStyle": color, gradient, etc,
        if the drawType was stroke rect
        "strokeStyle": same values as fillStyle,
        "lineWidth": self explanatory
    }
}


*/


let blockRenderData = {
    "air": {
        "drawType": "block", "color": undefined, "borderColor": undefined,
        "globalAlpha": 255, "length": blockSize, "position": [0, 0]
    }
};

let blockCursorHightlightData = {
    "strokeStyle": "black", "width": blockSize, "globalAlpha": 200,
    "drawType": "strokeRect", "height": blockSize, "position": [0, 0],
    "lineWidth": "3px"
}


let itemIconSize = player.inventoryRenderingData.slotSize - player.inventoryRenderingData.itemIconShift * 2;

let newCanvas = document.createElement("canvas");
newCanvas.id = "image creation canvas";
let context = newCanvas.getContext("2d");

function addABlock(blockType, color, borderColor, alpha = 255) {

    let data = {
        "drawType": "block",
        "color": color,
        "borderColor": borderColor || color,
        "globalAlpha": alpha,
        "length": blockSize,
        "position": [0, 0]
    }


    function nameToRgba(name) {
        context.fillStyle = name;
        context.fillRect(0, 0, 1, 1);
        return context.getImageData(0, 0, 1, 1).data;
    }



    if (borderColor === undefined) {
        let newBorderColor = nameToRgba(color);
        //consoleLog(newBorderColor)
    }

    newCanvas.width = data.length;
    newCanvas.height = data.length;
    context.fillStyle = data.color;
    context.strokeStyle = data.borderColor;
    context.globalAlpha = data.globalAlpha;
    context.fillRect(0, 0, newCanvas.width, newCanvas.height);
    context.strokeRect(0, 0, newCanvas.width, newCanvas.height);
    let image = new Image();
    image.src = newCanvas.toDataURL();
    images[blockType] = image;
    context.clearRect(0, 0, newCanvas.width, newCanvas.height);

    newCanvas.width = itemIconSize; newCanvas.height = itemIconSize;
    context.globalAlpha = 100; // change later, 255 should? be opaque
    context.drawImage(images[blockType], 0, 0, newCanvas.width, newCanvas.height);
    let itemIcon = new Image();
    itemIcon.src = newCanvas.toDataURL();
    images["item icons/" + blockType] = itemIcon;
    context.clearRect(0, 0, newCanvas.width, newCanvas.height);



    blockRenderData[blockType] = data;

};

addABlock("grass", "darkgreen", "brown")
addABlock("dirt", "brown")
addABlock("stone", "rgb(125, 125, 125)")
addABlock("cobblestone", "rgb(150, 150, 150)")
addABlock("snowy dirt", "rgb(220, 220, 220)", "brown")
addABlock("snowy stone", "rgb(220, 220, 220)", "rgb(125, 125, 125)")
addABlock("sand", "rgb(232, 228, 118)")
addABlock("clay", "rgb(196, 152, 94)")
addABlock("gravel", "rgb(150, 150, 150)")
addABlock("water", "rgb(0, 0, 255)", "rgb(0, 0, 255)")
addABlock("bedrock", "rgb(0, 255, 255)")
addABlock("log", "rgb(110, 79, 38)", "rgb(110, 79, 38)")
addABlock("planks", "rgb(140, 109, 68)")
addABlock("leaves", "rgb(29, 64, 17)")

newCanvas.display = "none;";

function generateNearbyAreas(rangeOfGeneration = 2, returnChunkList = false) {
    let chunkList = [];
    let cameraChunk = camera.currentChunk;
    let screenExtension = 1;

    let terrainGenRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension - rangeOfGeneration,
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1 + rangeOfGeneration
        },
        "z": {
            "min": cameraChunk[1] - screenExtension - rangeOfGeneration,
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1 + rangeOfGeneration
        }
    };

    let structureGenRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension - (rangeOfGeneration - 1),
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1 + (rangeOfGeneration - 1)
        },
        "z": {
            "min": cameraChunk[1] - screenExtension - (rangeOfGeneration - 1),
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1 + (rangeOfGeneration - 1)
        }
    };

    let blockUpdateRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension,
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1
        },
        "z": {
            "min": cameraChunk[1] - screenExtension,
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1
        }
    };


    for (let x = terrainGenRange.x.min; x < terrainGenRange.x.max; x++) {
        for (let z = terrainGenRange.z.min; z < terrainGenRange.z.max; z++) {
            if (chunks[[x, z].toString] === undefined) {
                generateChunkTerrain([x, z]);
                consoleLog("generating a chunk maybe")
            };
        };
    };


    for (let x = structureGenRange.x.min; x < structureGenRange.x.max; x++) {
        for (let z = structureGenRange.z.min; z < structureGenRange.z.max; z++) {
            if (!chunks[[x, z].toString()].structuresGenerated) { generateChunkStructures([x, z]); };
        }
    }

    for (let x = blockUpdateRange.x.min; x < blockUpdateRange.x.max; x++) {
        for (let z = blockUpdateRange.z.min; z < blockUpdateRange.z.max; z++) {
            chunkList.push([x, z]);
            if (!chunks[[x, z].toString()].blocksUpdated) {
                runBlockUpdatesAfterGeneration([x, z]);
            }
        }
    }

    if (returnChunkList) { return chunkList; };
};


export function generateSpawnArea() {
    let chunkList = [];
    let cameraChunk = camera.currentChunk;
    let screenExtension = 1;

    let rangeOfGeneration = 3;


    let terrainGenRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension - rangeOfGeneration,
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1 + rangeOfGeneration
        },
        "z": {
            "min": cameraChunk[1] - screenExtension - rangeOfGeneration,
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1 + rangeOfGeneration
        }
    };

    let structureGenRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension - (rangeOfGeneration - 1),
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1 + (rangeOfGeneration - 1)
        },
        "z": {
            "min": cameraChunk[1] - screenExtension - (rangeOfGeneration - 1),
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1 + (rangeOfGeneration - 1)
        }
    };

    let blockUpdateRange = {
        "x": {
            "min": cameraChunk[0] - screenExtension,
            "max": cameraChunk[0] + canvasWidthInChunks + screenExtension + 1
        },
        "z": {
            "min": cameraChunk[1] - screenExtension,
            "max": cameraChunk[1] + canvasHeightInChunks + screenExtension + 1
        }
    };


    for (let x = terrainGenRange.x.min; x < terrainGenRange.x.max; x++) {
        for (let z = terrainGenRange.z.min; z < terrainGenRange.z.max; z++) {
            if (chunks[[x, z].toString] === undefined) { generateChunkTerrain([x, z]); };
        };
    };
    ctx.fillText("chunk terrain generated", 100, 100);


    for (let x = structureGenRange.x.min; x < structureGenRange.x.max; x++) {
        for (let z = structureGenRange.z.min; z < structureGenRange.z.max; z++) {
            if (!chunks[[x, z].toString()].structuresGenerated) { generateChunkStructures([x, z]); };
        }
    }
    ctx.fillText("chunk structures generated", 100, 150)

    for (let x = blockUpdateRange.x.min; x < blockUpdateRange.x.max; x++) {
        for (let z = blockUpdateRange.z.min; z < blockUpdateRange.z.max; z++) {
            chunkList.push([x, z]);
            if (!chunks[[x, z].toString()].blocksUpdated) {
                runBlockUpdatesAfterGeneration([x, z]);
            }
        }
    }

    ctx.fillText("chunk blocks have been updated", 100, 200)
};


function drawToCanvas(renderData) {
    let drawType = renderData.drawType;
    let x = renderData.position[0] || 0;
    let y = renderData.position[1] || 0;

    // this fixes redclaring stuff
    let width = renderData.width || 20;
    let height = renderData.height || 20;
    let color = renderData.color || "pink"; // pink is a pretty visible "no color" indicator
    let globalAlpha = renderData.globalAlpha || 100;
    ctx.globalAlpha = globalAlpha;

    if (drawType == "block") {
        let borderColor = renderData.borderColor;

            ctx.fillStyle = color;
            ctx.strokeStyle = borderColor;

            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
            consoleLog("rendering a block")
    }

    switch (drawType) {
        case "block":
            let borderColor = renderData.borderColor;

            ctx.fillStyle = color;
            ctx.strokeStyle = borderColor;

            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
            consoleLog("rendering a block")

            break;

        case "image":
            let imageUrl = renderData.imageUrl + ".png"; // that's a little bit important, adding .png
            width = renderData.width || images[imageUrl].naturalWidth;
            height = renderData.height || images[imageUrl].naturalHeight;
            // later, add in sub-x and y, for doing stuff with spritesheets
            ctx.drawImage(images[imageUrl], x, y, width, height);

            break;

        case "fillRect":
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);

            break;
        case "strokeRect":

            ctx.strokeStyle = color;
            //ctx.stroke find line/border width later
            ctx.strokeRect(x, y, width, height);
            break;
    }
}



export function render(deltaTime) {



    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // get the chunks to be used for rendering
    let chunkList = generateNearbyAreas(2, true)


    // separate the blocks into layers, so they get rendered in the right order
    // also, keep track of the scale for each y layer
    let yLayer = [];
    for (let i = 0; i < chunkSize[1]; i++) {
        yLayer.push([]);
    };



    for (const chunkCoord of chunkList) {
        for (let y = 0; y < chunkSize[1]; y++) {


            // scale images outside of x/z loop, better performance

            let scaleFactor = 1

            // scale smoother when using exact position rather than player's block coord
            let playerYInBlocks = player.y / blockSize


            if (y > playerYInBlocks) {
                let differenceInBlocks = y - playerYInBlocks;
                differenceInBlocks /= blockSize;
                scaleFactor += differenceInBlocks;
            };


            if (y < playerYInBlocks) {
                let differenceInBlocks = playerYInBlocks - y;
                differenceInBlocks /= blockSize;
                scaleFactor -= differenceInBlocks;
            };


            if (scaleFactor < 0.1) { scaleFactor = 0.1; };
            if (scaleFactor > 5) { scaleFactor = 5; };







            let scaledRenderData = blockRenderData;


            for (let x = 0; x < chunkSize[0]; x++) {
                for (let z = 0; z < chunkSize[0]; z++) {

                    let block = chunks[chunkCoord.toString()].data[[x, y, z].toString()];

                    if (block.render && block.type != "air") {
                        let xPos = x * blockSize;
                        let yPos = z * blockSize;

                        xPos += chunkCoord[0] * totalChunkSize;
                        yPos += chunkCoord[1] * totalChunkSize;

                        if (block.type != "water") {
                            if (block.globalAlpha < 255 && player.blockCoord[1] < y) {
                                const fiveBlocks = 5 * blockSize;

                                if (xPos - fiveBlocks < player.x && xPos + fiveBlocks > player.x) {
                                    if (yPos - fiveBlocks < player.z && yPos + fiveBlocks > player.z) {
                                        scaledRenderData[block.type].globalAlpha = block.globalAlpha;
                                    };
                                };
                            };
                        };

                        if (block.type == "water") {
                            scaledRenderData[block.type].globalAlpha = block.globalAlpha;
                        };



                        if (!scaledRenderData[block.type].scaled) {
                            if (scaleFactor != 1) {

                                let scaledLength = scaledRenderData[block.type].length * scaleFactor;

                                scaledRenderData[block.type].length = scaledLength;

                            };
                            scaledRenderData[block.type].scaled = true;
                        };


                        xPos -= player.x
                        yPos -= player.z

                        xPos *= scaleFactor
                        yPos *= scaleFactor

                        xPos -= camera.x - player.x
                        yPos -= camera.z - player.z

                        let renderData = scaledRenderData[block.type];

                        renderData.position = [xPos, yPos];

                        yLayer[y].push(renderData)
                    };
                };
            };
        };
    };

    let renderingData = [];





    // add player to rendering
    if (player.blockCoord[1] < chunkSize[1]) {
        yLayer[player.blockCoord[1]].push(player.renderData);
    } else {
        renderingData.push(player.renderData);
    }

    if (entities.length > 0) {
        for (let i = -1; i >= -entities.length; i--) {
            let entityRenderData = entities[i].renderData;

            yLayer[entities[i].renderData.yLayer].push(entityRenderData);


        };
    };

    // add all the layers to the main rendering data
    for (let y = 0; y < chunkSize[1]; y++) {
        renderingData.push(...yLayer[y]);
    }



    renderingData.push(player.inventoryRenderingData.hotbarRenderData);


    // run inventory rendering
    if (player.otherInventoryData.open) {
        // render the base part of the inventory
        let renderData = player.inventoryRenderingData.inventoryRenderingData;
        renderingData.push(renderData);

        // render the 2x2 crafting grid and armor slots
        if (player.otherInventoryData.showCraftingAndArmor) {
            let renderData = player.inventoryRenderingData.craftingAndArmorRenderData;
            renderingData.push(renderData);
        };

        // render the 3x3 crafting ui if its visible
        if (player.otherInventoryData.showCraftingTable) {
            let renderData = player.inventoryRenderingData.craftingTableRenderData;
            renderingData.push(renderData);
        };

        // draw a rect thingy over the hovered slot, highlights it
        if (mouse.inPlayerInventory && mouse.inASlot) {
            let renderData = {
                "drawType": "image",
                "imageUrl": "slot outline",
                "position": player.inventory[mouse.hoveredSlotId].outlineRenderPosition
            };

            renderingData.push(renderData)
        };

        // highlight selected slots in crafting table
        if (mouse.inASlot && mouse.inPlayerCraftingTable && player.otherInventoryData.showCraftingTable) {
            let position = [0, 0];

            if (mouse.hoveredSlotId != "resultSlot") {
                position = player.crafting[player.crafting.gridSize].slots[mouse.hoveredSlotId].outlineRenderPosition;
            } else {
                position = player.crafting[player.crafting.gridSize].resultSlot.outlineRenderPosition;
            };

            let renderData = {
                "drawType": "image",
                "imageUrl": "slot outline",
                "position": position
            }

            renderingData.push(renderData)
        };

        // also highlight hovered slots, but only in the crafting and armor slots, if they're visible
        if (mouse.inPlayerCraftingAndArmor && mouse.inASlot && player.otherInventoryData.showCraftingAndArmor) {
            let position = [0, 0];
            if (mouse.hoveredSlotId != "resultSlot") {
                position = player.crafting[player.crafting.gridSize].slots[mouse.hoveredSlotId].outlineRenderPosition;
            } else {
                position = player.crafting[player.crafting.gridSize].resultSlot.outlineRenderPosition;
            }

            let renderData = {
                "drawType": "image",
                "imageUrl": "slot outline",
                "position": position
            }

            renderingData.push(renderData);
        };

        // render all the items of the base player inventory
        for (let i = 0; i < player.inventory.length; i++) {

            let slot = player.inventory[i];
            let item = slot.contents;

            if (item != "empty") {
                let renderData = {
                    "drawType": "image",
                    "imageUrl": "item icons/" + item.name,
                    "position": slot.renderPosition
                }

                renderingData.push(renderData);

                if (mouse.inPlayerInventory && mouse.inASlot) {
                    if (player.inventory[mouse.hoveredSlotId].contents == item) {
                        let tooltip = item.tooltip || "no tooltip";

                        let renderData = {
                            "drawType": "fillText",
                            "text": tooltip,
                            "position": [mouse.x + 10, mouse.y + 5]
                        }

                        renderingData.push(renderData)
                    };
                };


                if (slot.count > 1) {
                    let renderData = {
                        "drawType": "fillText",
                        "text": slot.count,
                        "position": slot.itemCountRenderPosition
                    }
                    renderingData.push(renderData);
                };
            };
        };

        // render items in 2x2 crafting and armor, only if they're visible
        if (player.otherInventoryData.showCraftingAndArmor) {

            function doTheThingy(slot, comparedSlotThing) {
                let item = slot.contents;

                if (item != "empty") {

                    let renderData = {
                        "drawType": "image",
                        "imageUrl": "item icons/" + item.name,
                        "position": slot.renderPosition
                    }
                    renderingData.push(renderData);


                    if (mouse.inPlayerInventory && mouse.inASlot) {
                        if (comparedSlotThing[mouse.hoveredSlotId].contents === item) {
                            let tooltip = item.tooltip || "no tooltip";
                            let renderData = {
                                "drawType": "fillText",
                                "text": tooltip,
                                "position": [mouse.x + 10, mouse.y + 5]
                            }
                            renderingData.push(renderData);
                        };
                    };


                    if (slot.count > 1) {
                        let renderData = {
                            "drawType": "fillText",
                            "text": slot.count,
                            "position": slot.itemCountRenderPosition
                        }
                        renderingData.push(renderData);
                    };
                };
            };

            if (player.crafting[player.crafting.gridSize].resultSlot.contents != "empty") {
                doTheThingy(
                    player.crafting[player.crafting.gridSize].resultSlot,
                    player.crafting[player.crafting.gridSize]
                )
            }

            for (let i = 0; i < player.crafting[player.crafting.gridSize].slots.length; i++) {
                let slot = player.crafting[player.crafting.gridSize].slots[i];
                doTheThingy(slot, this.inventory);
            };




            /*for slot in player.armor.values():
                //whoops, no armor exists, neither do the slots
                pass
                */
        };

        // render stuff in the 3x3 crafting grid if its visible
        if (player.otherInventoryData.showCraftingTable) {
            function doTheThingy(slot, comparedSlotThing) {
                let item = slot.contents;

                if (item != "empty") {

                    let renderData = {
                        "drawType": "image",
                        "imageUrl": "item icons/" + item.name,
                        "position": slot.renderPosition
                    }

                    renderingData.push(renderData)


                    if (mouse.inPlayerInventory && mouse.inASlot) {
                        if (comparedSlotThing[mouse.hoveredSlotId].contents === item) {
                            let tooltip = item.tooltip || "no tooltip";

                            let renderData = {
                                "drawType": "fillText",
                                "text": tooltip,
                                "position": [mouse.x + 10, mouse.y + 5]
                            }
                            renderingData.push(renderData);
                        };
                    };


                    if (slot.count > 1) {
                        let renderData = {
                            "drawType": "fillText",
                            "text": slot.count,
                            "position": slot.itemCountRenderPosition
                        }
                        renderingData.push(renderData)
                    };
                };
            }
            for (let i = 0; i < player.crafting[player.crafting.gridSize].slots.length; i++) {
                let slot = player.crafting[player.crafting.gridSize].slots[i];
                doTheThingy(slot, player.crafting[player.crafting.gridSize].slots);
            };

            doTheThingy(
                player.crafting[player.crafting.gridSize].resultSlot,
                player.crafting[player.crafting.gridSize]
            )

        };

        // run hotbar rendering
        for (let i = 0; i < player.hotbar.length; i++) {
            let slot = player.hotbar[i];
            let item = slot.contents;
            let currentHotbarSlot = player.otherInventoryData.currentHotbarSlot;

            if (item != "empty") {

                let renderData = {
                    "drawType": "image",
                    "imageUrl": item.name,
                    "position": slot.renderPosition
                }

                renderingData.push(renderData);
            }

            if (i == currentHotbarSlot) {

                let renderData = player.inventoryRenderingData.selectedSlotRenderData;
                renderData.position = slot.outlineRenderPosition;

                renderingData.push(renderData);

                if (mouse.inPlayerHotbar && mouse.inASlot) {

                    if (item != "empty" && player.otherInventoryData.open) {


                        let renderData = player.inventoryRenderingData.selectedSlotRenderData;
                        renderData.position = player.hotbar[mouse.hoveredSlotId].outlineRenderPosition;

                        renderingData.push(renderData);
                        if (player.hotbar[mouse.hoveredSlotId].contents === item) {

                            if (item.tooltip != "") {
                                let renderData = {
                                    "drawType": "fillText",
                                    "fillStyle": "white",
                                    "text": tooltip,
                                    "position": [mouse.x + 10, mouse.y + 5]
                                }

                                renderingData.push(renderData);
                            };
                        };
                    };


                };
            };

        };




        // run mouse's held item rendering
        // also highlights and tells what block you're hovering over
        if (!player.otherInventoryData.open) {
            let x = Math.floor(mouse.cameraRelativeX / blockSize);
            let z = Math.floor(mouse.cameraRelativeZ / blockSize);
            x *= blockSize;
            z *= blockSize;
            player.canReachSelectedBlock = false

            if (x < player.x + (player.horizontalBlockReach * blockSize)
                && x > player.x - (player.horizontalBlockReach * blockSize)
                && z < player.z + (player.horizontalBlockReach * blockSize)
                && z > player.z - (player.horizontalBlockReach * blockSize)
            ) {
                player.canReachSelectedBlock = true
                x -= camera.x
                z -= camera.z

                blockCursorHightlightData.position = [x, z];


                renderingData.push(blockCursorHightlightData)


                // do stuff so it displays the mouse's y selection and 
                // the block that the mouse is theoretically currently
                // selecting

                let renderData = {
                    "drawType": "fillText",
                    "position": [mouse.x, mouse.y + (blockSize * 1.5)],
                    "text": mouse.hoveredBlock.block.type + ", " + mouse.selectedYChange + " block up/down"
                }

                renderingData.push(renderData);
            };

        };





        if (mouse.heldSlot.contents != "empty") {
            let renderData = {
                "drawType": "image",
                "imageUrl": mouse.heldSlot.contents.name,
                "position": [mouse.x + 5, mouse.y + 5]
            }

            renderingData.push(renderData);

            shift = player.inventoryRenderingData["slotSize"] - 10

            // draw the item count, if there's more than one item
            if (mouse.heldSlot.count > 1) {
                let renderData = {
                    "drawType": "fillText",
                    "fillStyle": "white",
                    "text": mouse.heldSlot.count,
                    "position": [mouse.x + shift, mouse.y + shift]
                }
                renderingData.push(renderData);
            };
        };



        for (let i = 0; i < renderingData.length; i++) {
            drawToCanvas(renderingData[i]);
        };


        // debug things
        let debug1 = {
            "drawType": "fillText",
            "fillStyle": "red",
            "text": "camera chunk: " + camera.currentChunk + ", player chunk: " + player.chunkCoord,
            "position": [300, 100]
        }
        drawToCanvas(debug1);

        let debug2 = {
            "drawType": "fillText",
            "fillStyle": "red",
            "text": "player block coord " + player.blockCoord + ", player yv " + player.yv,
            "position": [300, 125]
        }
        drawToCanvas(debug2);

        let debug3 = {
            "drawType": "fillText",
            "fillStyle": "red",
            "text": "mouse pos " + mouse.pos + ", mouse relative pos " + mouse.cameraRelativePos,
            "position": [300, 150]
        }
        drawToCanvas(debug3);


    };
};


showLoadingProgress("Rendering.mjs initialized");


