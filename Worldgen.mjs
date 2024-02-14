
import {
  chunkSize, chunks, blockSize, totalChunkSize, camera, canvasHeightInChunks, canvasWidthInChunks,
  listOfBlockNames, dictOfBlockBreakingStuff, consoleLog, random, showLoadingProgress
} from "./GlobalVariables.mjs";
showLoadingProgress("loading Worldgen.mjs");

import { noise } from "./PerlinNoise.mjs";

// set the seed for this world
noise.seed(Math.random());


let structures = {
  "tree 1": {}
};

function makeTree1() {
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      structures["tree 1"][[x, 3, z].toString()] = { "type": "leaves" };

      if (x !== 0 && x !== 4 && z !== 0 && z != 4) {
        structures["tree 1"][[x, 4, z].toString()] = { "type": "leaves" };
      };
    };
  };

  structures["tree 1"]["2,3,2"] = { "type": "log" }
  structures["tree 1"]["2,0,2"] = { "type": "log" }
  structures["tree 1"]["2,1,2"] = { "type": "log" }
  structures["tree 1"]["2,2,2"] = { "type": "log" }
}
makeTree1();



// add any additional things that all blocks require in their data automatically such as render

function fixStructureData() {
  let structureNames = Object.keys(structures);
  for (let i = 0; i < structureNames.length; i++) {
    let structureName = structureNames[i];
    let blockCoords = Object.keys(structures[structureName]);

    for (let i2 = 0; i2 < blockCoords.length; i2++) {

      let blockCoord = blockCoords[i2]
      let block = structures[structureName][blockCoord];

      block.render = false;
      block.alphaValue = 255;

      let accessedBreakingInfo = dictOfBlockBreakingStuff[block.type];
      block.hardness = accessedBreakingInfo.hardness;
      block.effectiveTool = accessedBreakingInfo.effectiveTool;
      block.dropsWithNoTool = accessedBreakingInfo.dropsWithNoTool;
      structures[structureName][blockCoord] = block;
    }
  }
}
fixStructureData();

let waterHeight = 4;

export function generateChunkTerrain(chunkCoords) {
  let chunkData = {};

  function initialTerrainGeneration() {

    for (let x = 0; x < chunkSize[0]; x++) {
      for (let y = 0; y < chunkSize[1]; y++) {
        for (let z = 0; z < chunkSize[0]; z++) {
          let blockData = {
            "type": "air",
            "render": False,
            "alphaValue": 255,
            "hardness": 0,
            "effectiveTool": "none",
            "dropsWithNoTool": false
          }

          let noiseX = x;
          let noiseZ = z;
          let noiseIntensity = 25;
          noiseX += chunkSize[0] * chunkCoords[0];
          noiseZ += chunkSize[0] * chunkCoords[1];

          noiseX /= noiseIntensity;
          noiseZ /= noiseIntensity;

          let surfaceYLevel = Math.round(Math.abs(noise.perlin2(noiseX, noiseZ) * noiseIntensity)) + 1;

          if (y > surfaceYLevel) {
            if (y <= waterHeight) {
              blockData.type = "water";
            }
          }
          if (y === surfaceYLevel) {
            blockData.type = "grass";
          }

          if (y < surfaceYLevel) {
            if (y < 8) {
              blockData.type = "dirt";
            }
            if (y >= 8) {
              blockData.type = "stone";
            }
            if (y < 6) {
              blockData.type = "sand";
            }
            if (y < waterHeight) {
              let randomNum = Math.floor(Math.random() * 3);
              switch (randomNum) {
                case randomNum === 0:
                  blockData.type = "sand";
                  break;
                case randomNum === 1:
                  blockData.type = "clay";
                  break;
                case randomNum === 2:
                  blockData.type = "gravel";
                  break;
                  break;
              }

            };

          }

          if (y >= 8) { blockData.type = "stone"; };
          if (y < 10) { blockData.type = "dirt"; };
          if (y > 15) { blockData.type = "snowy stone"; };



          if (y === 0) { blockData.type = "bedrock"; };

          let accessedBreakingInfo = dictOfBlockBreakingStuff[blockData.type];

          blockData["hardness"] = accessedBreakingInfo.hardness;
          blockData["effectiveTool"] = accessedBreakingInfo.effectiveTool;
          blockData["dropsWithNoTool"] = accessedBreakingInfo.dropsWithNoTool;


          chunkData[[x, y, z].toString()] = blockData;

        }
      }
    }
  }
  initialTerrainGeneration()

  chunks[chunkCoords] = {
    "data": chunkData,
    "blocksUpdated": false,
    "structuresGenerated": false
  };
}


function generateChunkStructures(inputChunkCoord) {
  function generateStructure(structureName, blockCoord) {
    let thisStructure = structures[structureName];
    let thisStructureKeys = Object.keys(thisStructure);

    for (let i = 0; i < thisStructureKeys.length; i++) {
      let chunkX = inputChunkCoord[0];
      let chunkZ = inputChunkCoord[1];

      let structureBlockCoord = thisStructureKeys[i];
      let block = thisStructure[structureBlockCoord];

      let x = blockCoord[0] + structureBlockCoord[0];
      let y = blockCoord[1] + structureBlockCoord[1];
      let z = blockCoord[2] + structureBlockCoord[2];

      while (x >= chunkSize[0]) {
        x -= chunkSize;
        chunkX += 1;
      }
      while (x < 0) {
        x += chunkSize[0];
        chunkX -= 1;
      }
      while (z >= chunkSize[0]) {
        z -= chunkSize[0];
        chunkZ += 1;
      }
      while (z < 0) {
        z += chunkSize[0];
        chunkZ -= 1;
      };

      if (y <= 0) {
        y = 1
      };
      if (y >= chunkSize[1]) {
        y = chunkSize[0] - 1;
      };

      let newBlockCoord = [x, y, z].toString();
      let chunkCoord = [chunkX, chunkZ].toString();

      if (chunks[chunkCoord]["data"] === undefined) {
        generateChunkTerrain(chunkCoord);
      };

      chunks[chunkCoord]["data"][newBlockCoord] = block;
    };
  };
  for (let x = 0; x < chunkSize[0]; x++) {
    for (let y = 0; y < chunkSize[1]; y++) {
      for (let z = 0; z < chunkSize[0]; y++) {

        let blockCoord = [x, y, z].toString();
        let block = chunks[inputChunkCoord]["data"][blockCoord];

        if (block.type === "grass") {
          if (random.integer(0, 20) === 0) {
            generateStructure("tree 1", blockCoord);
          };
        };
        chunks[inputChunkCoord].structuresGenerated = true;

      };
    };
  };
};


function runBlockUpdatesAfterGeneration(chunkCoord) {
  for (let x = 0; x < chunkSize[0]; x++) {
    for (let y = 0; y < chunkSize[1]; y++) {
      for (let z = 0; z < chunkSize[0]; z++) {
        let blockCoord = [x, y, z].toString();
        let block = chunks[chunkCoord].data[blockCoord];

        function checkForSolidBlock(block) {
          if (block.type != "air" && block.type != "water") {
            return true;
          };
          return false;

        };

        function modifyOtherBlock(x, y, z, render = "no change", alphaValue = "no change") {
          let localBlockAndChunkCoord = getBlockAndChunkCoord(x, y, z, chunkCoord);
          let localBlockCoord = localBlockAndChunkCoord[0];
          let localChunkCoord = localBlockAndChunkCoord[1];

          if (render != "no change") {
            chunks[localChunkCoord].data[localBlockCoord].render = render;
          };
          if (alphaValue != "no change") {
            chunks[localChunkCoord].data[localBlockCoord].alphaValue = alphaValue;
          };
        };


        if (block.type == "water") {
          let hopefullyAir = findBlock(x, y + 1, z, extraInfo = true, chunkCoordInput = chunkCoord);

          if (hopefullyAir.type == "air") {
            block.alphaValue = 100;
            block.render = true;

            let didntFindWater = true;

            let subtractY = 1;

            while (didntFindWater) {
              // make sure no blocks underneath are rendered, make top water less transparent
              let hopefullyWater = findBlock(x, y - subtractY, z, extraInfo = true, chunkCoordInput = chunkCoord);

              if (hopefullyWater.type == "water") {
                block.alphaValue += 25;
              } else { didntFindWater = false; }

              if (block.alphaValue >= 255) {
                block.alphaValue = 255;
                break;
              }

              if (subtractY <= -chunkSize[1] || !didntFindWater) {
                break;
              }

              subtractY -= 1;
            }; // end of while loop
          };


          let blockAbove = findBlock(x, y + 1, z, extraInfo = True, chunkCoordInput = chunkCoord);
          let blockBelow = findBlock(x, y - 1, z, extraInfo = True, chunkCoordInput = chunkCoord);
          let blockToRight = findBlock(x + 1, y, z, extraInfo = True, chunkCoordInput = chunkCoord);
          let blockToLeft = findBlock(x - 1, y, z, extraInfo = True, chunkCoordInput = chunkCoord);
          let blockToDown = findBlock(x, y, z + 1, extraInfo = True, chunkCoordInput = chunkCoord);
          let blockToUp = findBlock(x, y, z - 1, extraInfo = True, chunkCoordInput = chunkCoord);

          let above = checkForSolidBlock(blockAbove);
          let below = checkForSolidBlock(blockBelow);
          let toRight = checkForSolidBlock(blockToRight);
          let toLeft = checkForSolidBlock(blockToLeft);
          let toUp = checkForSolidBlock(blockToUp);
          let toDown = checkForSolidBlock(blockToDown);

          let surrounded = false;
          if (toLeft && toUp && toDown && toRight) { surrounded = true; };


          if (above) {
            if (blockBelow.alphaValue < 255) {
              // current block should have alpha, hide the block underneath
              block.alphaValue = 150;
              block.render = true;
              modifyOtherBlock(x, y - 1, z, render = false);
            };

            if (!surrounded) {
              block.render = true;
            };
          } else {
            // no block is above, should probably be rendered
            block.render = true;
          };

          if (below) {
            if (!above) { block.render = true; }
            if (blockBelow.alphaValue < 255) {
              block.alphaValue = 150;
              block.render = true;
              modifyOtherBlock(x, y - 1, z, render = false);
            };
            if (block.render) { modifyOtherBlock(x, y - 1, z, render = false); };

          } else {
            // no block is under this one
            if (!above) {
              block.render = true;
              block.alphaValue = 100;
            };
          };
        };
      };
    };

    chunks[chunkCoord].data[blockCoord] = block;
    chunks[chunkCoord].blocksUpdated = true;
  };
};




function smallScaleBlockUpdates(chunkCoord, blockCoord) {

  let x = blockCoord[0];
  let y = blockCoord[1];
  let z = blockCoord[2];

  let block = chunks[chunkCoord].data[blockCoord];

  function checkForSolidBlock(block) {
    if (block.type != "water" && block.type != "air") { return true; };
    return false
  };

  let blockAbove = findBlock(x, y + 1, z, extraInfo = true, chunkCoordInput = chunkCoord)
  let blockBelow = findBlock(x, y - 1, z, extraInfo = true, chunkCoordInput = chunkCoord)
  let blockToRight = findBlock(x + 1, y, z, extraInfo = true, chunkCoordInput = chunkCoord)
  let blockToLeft = findBlock(x - 1, y, z, extraInfo = true, chunkCoordInput = chunkCoord)
  let blockToUp = findBlock(x, y, z - 1, extraInfo = true, chunkCoordInput = chunkCoord)
  let blockToDown = findBlock(x, y, z + 1, extraInfo = true, chunkCoordInput = chunkCoord)

  let above = checkForSolidBlock(blockAbove)
  let below = checkForSolidBlock(blockBelow)
  let toRight = checkForSolidBlock(blockToRight)
  let toLeft = checkForSolidBlock(blockToLeft)
  let toUp = checkForSolidBlock(blockToUp)
  let toDown = checkForSolidBlock(blockToDown)

  let surrounded = false;
  if (toRight && toLeft && toUp && toDown) { surrounded = true; };


  function modifyOtherBlock(x, y, z, render = "no change", alphaValue = "no change") {
    let localBlockAndChunkCoord = getBlockAndChunkCoord(x, y, z, chunkCoord);
    let localBlockCoord = localBlockAndChunkCoord[0];
    let localChunkCoord = localBlockAndChunkCoord[1];

    if (render != "no change") {
      chunks[localChunkCoord].data[localBlockCoord].render = render;
    };
    if (alphaValue != "no change") {
      chunks[localChunkCoord].data[localBlockCoord].alphaValue = alphaValue;
    };
  };

  function checkSidesOfBlock(x, y, z) {
    let left = findBlock(x - 1, y, z, chunkCoordInput = chunkCoord)
    let right = findBlock(x + 1, y, z, chunkCoordInput = chunkCoord)
    let down = findBlock(x, y, z + 1, chunkCoordInput = chunkCoord)
    let up = findBlock(x, y, z - 1, chunkCoordInput = chunkCoord)
    if (left && right && down && up) { return true; };
    return false;
  };



  if (block.type != "air") {
    if (above) {
      if (!surrounded) { block.render = true; };

      if (below) {

        if (blockBelow.alphaValue < 255) {
          block.alphaValue = 100
          modifyOtherBlock(x, y - 1, z, render = false)

        } else {

          let belowSurrounded = checkSidesOfBlock(x, y - 1, z);
          if (belowSurrounded) {
            modifyOtherBlock(x, y - 1, z, render = false);
          };
        };
      } else { block.alphaValue = 100; };
    };

    if (!above) {
      block.render = true;
      if (below) {

        if (blockBelow.alphaValue < 255) {
          block.alphaValue = 100;
          modifyOtherBlock(x, y - 1, z, render = false);
        } else {

          let belowSurrounded = checkSidesOfBlock(x, y - 1, z)
          if (belowSurrounded) {
            modifyOtherBlock(x, y - 1, z, render = false);
          };
        };

      } else { block.alphaValue = 100; };
    };
  } else { // current block is air

    if (below) {
      modifyOtherBlock(x, y - 1, z, render = true)

      let blockBelow2 = findBlock(x, y - 2, z, true, chunkCoordInput = chunkCoord)
      let below2 = checkForSolidBlock(blockBelow2)

      if (!below2) {
        modifyOtherBlock(x, y - 1, z, render = true, alphaValue = 100)
      } else {
        if (blockBelow2.alphaValue < 255) {
          modifyOtherBlock(x, y - 2, z, render = false);
          modifyOtherBlock(x, y - 1, z, alphaValue = 100);
        };
      };
    };
  };


  chunks[chunkCoord].data[blockCoord] = block;
};

export function findBlock(xPos, yPos, zPos, extraInfo = false, ignoreWater = false,
  chunkCoordInput = undefined) {
  let blockCoord = [0, 0, 0];
  let chunkCoord = [0, 0];
  if (chunkCoordInput !== undefined) {
    let x = xPos;
    let y = yPos;
    let z = zPos;

    let chunkX = chunkCoordInput[0]
    let chunkZ = chunkCoordInput[1]

    while (x >= chunkSize[0]) {
      x -= chunkSize[0]
      chunkX += 1
    };
    while (x < 0) {
      x += chunkSize[0]
      chunkX -= 1
    };

    if (y >= chunkSize[1]) { y = chunkSize[1] - 1; };
    if (y < 0) { y = 0; };

    while (z >= chunkSize[0]) {
      z -= chunkSize[0]
      chunkZ += 1
    };
    while (z < 0) {
      z += chunkSize[0];
      chunkZ -= 1;
    };

    blockCoord = [x, y, z].toString();
    chunkCoord = [chunkX, chunkZ].toString();
  } else {
    blockCoord = getBlockCoord(xPos, yPos, zPos);
    chunkCoord = getChunkCoord(xPos, zPos);
  };


  if (chunks[chunkCoord].data[blockCoord] === undefined) {
    generateChunkTerrain(chunkCoord);
  };

  let block = chunks[chunkCoord].data[blockCoord];

  if (extraInfo) { return block; };

  if (block.type != "air") {
    if (block.type == "water" && ignoreWater) { return false; };
    return true;
  };

  return false;
};

export function getChunkCoord(xPos = 1, zPos = 1) {

  let x = Math.floor(xPos / totalChunkSize);
  let z = Math.floor(zPos / totalChunkSize);

  chunkCoord = [x, z].toString();

  return chunkCoord;
};

export function getBlockCoord(xPos = 1, yPos = 1, zPos = 1, usesSimpleInputs = false) {

  let x = xPos;
  let y = yPos;
  let z = zPos;
  if (!usesSimpleInputs) {
    x = Math.floor(xPos / blockSize);
    y = Math.floor(yPos / blockSize);
    z = Math.floor(zPos / blockSize);
  };


  while (x < 0) { x += chunkSize[0]; };
  while (x >= chunkSize[0]) { x -= chunkSize[0]; };

  if (y >= chunkSize[1]) { y = chunkSize[1] - 1; };
  if (y < 0) { y = 0; };

  while (z < 0) { z += chunkSize[0]; };
  while (z >= chunkSize[0]) { z -= chunkSize[0]; };

  blockCoord = [x, y, z].toString();

  return blockCoord;
};

function getBlockAndChunkCoord(xPos, yPos, zPos, inputChunkCoord) {
  let x = xPos
  let y = yPos
  let z = zPos
  let chunkX = inputChunkCoord[0]
  let chunkZ = inputChunkCoord[1]

  while (x < 0) {
    x += chunkSize[0]
    chunkX -= 1;
  };
  while (x >= chunkSize[0]) {
    x -= chunkSize[0];
    chunkX += 1;
  };

  if (y >= chunkSize[1]) { y = chunkSize[1] - 1; };
  if (y < 0) { y = 0; };

  while (z < 0) {
    z += chunkSize[0];
    chunkZ -= 1;
  };
  while (z >= chunkSize[0]) {
    z -= chunkSize[0];
    chunkZ += 1;
  };

  let blockCoord = [x, y, z].toString();
  let chunkCoord = [chunkX, chunkZ].toString();
  let blockAndChunkCoord = [blockCoord, chunkCoord];

  return blockAndChunkCoord;
}


showLoadingProgress("worldgen initialized");




