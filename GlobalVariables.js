/*import pygame, math
pygame.display.init()
pygame.font.init()

screenWidth, screenHeight = 1000, 500

font = pygame.font.Font(size = 24)

blockSize = 30 # pixels
chunkSize = (10, 30) # width or length, then height (both in blocks)

totalChunkSize = chunkSize[0] * blockSize

gravity = 1

itemEntitySize = blockSize/2

chunks = {}

keys = {}
keysPressed = {}

deltaTime = 1


# extra info for what is required to break blocks
dictOfBlockBreakingStuff = {
    # sediment/shovel effective type blocks
    "grass": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    "dirt": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    "snowy dirt": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    "clay": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    "gravel": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    "sand": {"hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": True},
    
    # stone/pickaxe effective type blocks
    "stone": {"hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": False},
    "snowy stone": {"hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": False},
    "cobblestone": {"hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": False},
    
    # wood/axe effective type blocks
    "log": {"hardness": 2, "effectiveTool": "axe", "dropsWithNoTool": True},
    "planks": {"hardness": 2, "effectiveTool": "axe", "dropsWithNoTool": True},
    "leaves": {"hardness": 0, "effectiveTool": "axe", "dropsWithNoTool": False},
    "crafting table": {"hardness": 1, "effectiveTool": "axe", "dropsWithNoTool": True},

    # any new tools types to add here? this is where they go


    # unbreakable blocks/wouldn't make sense to be able to break them
    "bedrock": {"hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": False},
    "air": {"hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": False},
    "water": {"hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": False}
}



screenWidthInChunks = math.floor( screenWidth / totalChunkSize )
screenHeightInChunks = math.floor( screenHeight / totalChunkSize )

# every entity will be here, besides player
# hopefully doing the stuff for these entities isn't super laggy
# need to add a for loop that does a standard function for each entity,
# like entity.runSelf(deltaTime) or something
entities = []
projectiles = []

# dict with all items in it
items = {}
itemIcons = {}

FPS = 60

maxStackSize = 64

recipes = {
    # the first numer is what size of grid is required, should be faster to check only a single time
    # so the player doesn't loop through the size 3 grid when they only have access to size 2
    2: {
    "exact": {},
    "nearExact": {},
    "shapeless": {}
    },
    3: {
        "exact": {},
        "nearExact": {},
        "shapeless": {}
    }
}

listOfIntermediateItems = [
    "stick"
]

listOfBlockNames = []

for key in dictOfBlockBreakingStuff.keys():
    listOfBlockNames.append(key)


class Camera():
    def __init__(self):
        self.smoothness = 10
        self.centerTheCamera = (screenWidth/2, screenHeight/2)
        self.x = -self.centerTheCamera[0]
        self.y = 0
        self.z = -self.centerTheCamera[1]
        self.currentChunk = (0, 0)
        # do i want to have camera shake later?
        # self.shakeStrength = 0
        # self.shakeDuration = 0
camera = Camera()



def rotatePoint(surface, angle, pivot, offset = pygame.math.Vector2(0, 0)):
    """Rotate the surface around the pivot point.
    thank you other people, for figuring this out for me so i can copy it
    Args:
        surface (pygame.Surface): The surface that is to be rotated.
        angle (float): Rotate by this angle.
        pivot (tuple, list, pygame.math.Vector2): The pivot point.
        offset (pygame.math.Vector2): This vector is added to the pivot.
    """
    rotated_image = pygame.transform.rotozoom(surface, -angle, 1)  # Rotate the image.
    rotated_offset = offset.rotate(angle)  # Rotate the offset vector.
    # Add the offset vector to the center/pivot point to shift the rect.
    rect = rotated_image.get_rect(center = pivot + rotated_offset)
    return rotated_image, rect  # Return the rotated image and shifted rect.



print("global variables initialized")
*/

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const screenWidth = 1000;
const screenHeight = 500;

const font = "24px Arial";

export const blockSize = 30; // pixels
const chunkSize = [10, 30]; // width or length, then height (both in blocks)

const totalChunkSize = chunkSize[0] * blockSize;

const gravity = 1;

const itemEntitySize = blockSize / 2;

const chunks = {};

const keys = {};
const keysPressed = {};

const deltaTime = 1;

const dictOfBlockBreakingStuff = {
    "grass": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "dirt": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "snowy dirt": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "clay": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "gravel": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "sand": { "hardness": 1, "effectiveTool": "shovel", "dropsWithNoTool": true },
    "stone": { "hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": false },
    "snowy stone": { "hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": false },
    "cobblestone": { "hardness": 2, "effectiveTool": "pickaxe", "dropsWithNoTool": false },
    "log": { "hardness": 2, "effectiveTool": "axe", "dropsWithNoTool": true },
    "planks": { "hardness": 2, "effectiveTool": "axe", "dropsWithNoTool": true },
    "leaves": { "hardness": 0, "effectiveTool": "axe", "dropsWithNoTool": false },
    "crafting table": { "hardness": 1, "effectiveTool": "axe", "dropsWithNoTool": true },
    "bedrock": { "hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": false },
    "air": { "hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": false },
    "water": { "hardness": "infinity", "effectiveTool": "none", "dropsWithNoTool": false }
};

const screenWidthInChunks = Math.floor(screenWidth / totalChunkSize);
const screenHeightInChunks = Math.floor(screenHeight / totalChunkSize);

const entities = [];
const projectiles = [];

const items = {};
const itemIcons = {};

const FPS = 60;

const maxStackSize = 64;

const recipes = {
    2: {
        "exact": {},
        "nearExact": {},
        "shapeless": {}
    },
    3: {
        "exact": {},
        "nearExact": {},
        "shapeless": {}
    }
};

const listOfIntermediateItems = ["stick"];

const listOfBlockNames = Object.keys(dictOfBlockBreakingStuff);

class Camera {
    constructor() {
        this.smoothness = 10;
        this.centerTheCamera = [screenWidth / 2, screenHeight / 2];
        this.x = -this.centerTheCamera[0];
        this.y = 0;
        this.z = -this.centerTheCamera[1];
        this.currentChunk = [0, 0];
    }
}

const camera = new Camera();

function rotatePoint(surface, angle, pivot, offset = { x: 0, y: 0 }) {
    const rotatedImage = rotateSurface(surface, -angle, 1);
    const rotatedOffset = rotateVector(offset, angle);
    const rect = rotatedImage.getClientRects()[0];

    return {
        rotatedImage,
        rect: {
            x: pivot.x + rotatedOffset.x - rect.width / 2,
            y: pivot.y + rotatedOffset.y - rect.height / 2,
            width: rect.width,
            height: rect.height
        }
    };
}

function rotateSurface(surface, angle, scale) {
    const rotatedSurface = document.createElement("canvas");
    const rotatedCtx = rotatedSurface.getContext("2d");

    rotatedSurface.width = surface.width;
    rotatedSurface.height = surface.height;

    rotatedCtx.translate(surface.width / 2, surface.height / 2);
    rotatedCtx.rotate(angle);
    rotatedCtx.scale(scale, scale);
    rotatedCtx.drawImage(surface, -surface.width / 2, -surface.height / 2);

    return rotatedSurface;
}

function rotateVector(vector, angle) {
    const x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
    const y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);

    return { x, y };
}

console.log("global variables initialized");
