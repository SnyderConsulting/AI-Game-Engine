import {
  spawnPlayer,
  SEGMENT_SIZE,
  PLAYER_MAX_HEALTH,
  createSpawnDoor,
  spawnContainers,
  openContainer,
} from "../game_logic.js";
import {
  circleRectColliding,
  checkAllCollisions,
} from "../systems/collision-system.js";
import { moveTowards, isColliding } from "../utils/geometry.js";
import {
  spawnZombieWave,
  updateZombies,
  attackZombiesWithKills,
} from "../entities/zombie.js";
import {
  generateStoreWalls,
  damageWall,
  updateWalls,
  wallSwingHit,
  openShelf,
} from "../walls.js";
import {
  createPlayer,
  resetPlayerForNewGame,
  tryPhoenixRevival,
} from "../entities/player.js";
import {
  createInventory,
  addItem,
  moveToHotbar,
  consumeHotbarItem,
  getActiveHotbarItem,
  setActiveHotbar,
} from "../inventory.js";
import { RECIPES, canCraft, craftRecipe } from "../crafting.js";
import { dropLoot } from "../loot.js";
import { SKILL_INFO, SKILL_UPGRADERS } from "../skill_tree.js";
import { createOrbs } from "../entities/orbs.js";
import { updateAbilities } from "../systems/ability-system.js";
import { render as renderScene } from "../systems/rendering-system.js";
import { makeDraggable } from "../ui.js";
import { createInventoryUI } from "../components/inventory-ui.js";
import { createSkillTreeUI } from "../components/skill-tree-ui.js";
import { createHUD } from "../components/hud.js";
import { createCraftingUI } from "../components/crafting-ui.js";
import {
  applyConsumableEffect,
  CONSUMABLE_ITEMS,
  ITEM_ICONS,
  CRAFTING_MATERIALS,
} from "../items.js";
import { getItemCooldown } from "../cooldowns.js";

export class GameScene {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.mainMenu = document.getElementById("mainMenu");
    this.startBtn = document.getElementById("startBtn");
    this.gameOverDiv = document.getElementById("gameOver");
    this.newGameBtn = document.getElementById("newGameBtn");
    this.victoryDiv = document.getElementById("victory");
    this.victoryBtn = document.getElementById("victoryBtn");
    this.waveCounterDiv = document.getElementById("waveCounter");

    this.inventoryDiv = document.getElementById("inventory");
    this.inventoryGrid = document.getElementById("inventoryGrid");
    this.inventoryBar = document.getElementById("inventoryBar");
    this.inventoryClose = document.getElementById("inventoryClose");
    this.hotbarDiv = document.getElementById("hotbar");

    this.pickupMsg = document.getElementById("pickupMessage");
    this.craftingDiv = document.getElementById("craftingMenu");
    this.craftingList = document.getElementById("craftingList");
    this.craftingBar = document.getElementById("craftingBar");
    this.craftingClose = document.getElementById("craftingClose");
    this.lootDiv = document.getElementById("lootProgress");
    this.lootFill = document.getElementById("lootFill");
    this.skillTreeDiv = document.getElementById("skillTree");
    this.skillTreeBar = document.getElementById("skillTreeBar");
    this.skillTreeClose = document.getElementById("skillTreeClose");
    this.skillPointsDiv = document.getElementById("skillPoints");
    this.skillGrid = document.getElementById("skillGrid");
    this.skillDetails = document.getElementById("skillDetails");
    this.skillNameDiv = document.getElementById("skillName");
    this.skillDescDiv = document.getElementById("skillDesc");
    this.skillLevelsDiv = document.getElementById("skillLevels");
    this.skillLevelDiv = document.getElementById("skillLevel");
    this.skillCostDiv = document.getElementById("skillCost");
    this.skillUpgradeBtn = document.getElementById("skillUpgrade");

    this.ITEM_IMAGES = {};
    for (const [id, path] of Object.entries(ITEM_ICONS)) {
      const img = new Image();
      img.src = path;
      this.ITEM_IMAGES[id] = img;
    }

    this.MATERIAL_DROPS = {
      plastic: "plastic_fragments",
      wood: "wood_planks",
      steel: "steel_plates",
    };

    this.cardboardBoxImg = new Image();
    this.cardboardBoxImg.src = "assets/cardboard_box.png";

    this.hud = createHUD({
      pickupMsg: this.pickupMsg,
      waveCounterDiv: this.waveCounterDiv,
    });

    this.playerSprite = new Image();
    this.playerSprite.src = "assets/sprite_player.png";
    this.zombieSprite = new Image();
    this.zombieSprite.src = "assets/sprite_zombie.png";
    this.fireZombieSprite = new Image();
    this.fireZombieSprite.src = "assets/sprite_fire_zombie.png";

    this.player = createPlayer(PLAYER_MAX_HEALTH);
    this.zombies = [];
    this.walls = [];
    this.weapon = null;
    this.spawnDoor = null;
    this.containers = [];
    this.looting = null;
    this.lootTimer = 0;
    this.gameOver = false;
    this.victory = false;
    this.currentWave = 1;
    this.keys = {};
    this.inventory = createInventory();
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.skillTreeOpen = false;
    this.worldItems = [];
    this.fireballs = [];
    this.fireOrbs = [];
    this.arrows = [];
    this.explosions = [];
    this.fireballCooldown = 0;
    this.bowAiming = false;
    this.mousePos = { x: 0, y: 0 };
    this.inventoryPos = { left: null, top: null };
    this.craftingPos = { left: null, top: null };
    this.skillTreePos = { left: null, top: null };
    this.prevUse = false;
    this.prevAim = false;
    this.LOOT_TIME = 180;
    this.LOOT_DIST = 20;

    this.inventoryUI = createInventoryUI({
      inventoryDiv: this.inventoryDiv,
      inventoryGrid: this.inventoryGrid,
      hotbarDiv: this.hotbarDiv,
      inventoryBar: this.inventoryBar,
      inventoryClose: this.inventoryClose,
      inventoryPos: this.inventoryPos,
    });

    this.skillTreeUI = createSkillTreeUI(
      {
        skillTreeDiv: this.skillTreeDiv,
        skillTreeBar: this.skillTreeBar,
        skillTreeClose: this.skillTreeClose,
        skillPointsDiv: this.skillPointsDiv,
        skillGrid: this.skillGrid,
        skillDetails: this.skillDetails,
        skillNameDiv: this.skillNameDiv,
        skillDescDiv: this.skillDescDiv,
        skillLevelsDiv: this.skillLevelsDiv,
        skillLevelDiv: this.skillLevelDiv,
        skillCostDiv: this.skillCostDiv,
        skillUpgradeBtn: this.skillUpgradeBtn,
        skillTreePos: this.skillTreePos,
      },
      ITEM_ICONS,
    );

    this.craftingUI = createCraftingUI(
      {
        craftingDiv: this.craftingDiv,
        craftingList: this.craftingList,
        craftingBar: this.craftingBar,
        craftingClose: this.craftingClose,
        craftingPos: this.craftingPos,
      },
      {
        renderInventory: () => this.renderInventory(),
        renderHotbar: () => this.renderHotbar(),
      },
    );

    makeDraggable(
      this.inventoryDiv,
      this.inventoryBar,
      this.inventoryClose,
      this.inventoryPos,
      (o) => this.toggleInventory(o),
    );
    makeDraggable(
      this.craftingDiv,
      this.craftingBar,
      this.craftingClose,
      this.craftingPos,
      (o) => this.toggleCrafting(o),
    );
    makeDraggable(
      this.skillTreeDiv,
      this.skillTreeBar,
      this.skillTreeClose,
      this.skillTreePos,
      (o) => this.toggleSkillTree(o),
    );

    this.skillUpgradeBtn.addEventListener("click", () =>
      this.handleSkillUpgrade(),
    );
    this.startBtn.addEventListener("click", () => {
      this.mainMenu.style.display = "none";
      this.startGame();
    });
    this.newGameBtn.addEventListener("click", () => {
      this.gameOverDiv.style.display = "none";
      this.startGame();
    });
    this.victoryBtn.addEventListener("click", () => {
      this.victoryDiv.style.display = "none";
      this.startGame();
    });
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startGame() {
    this.resizeCanvas();
    this.resetGame();
  }

  resetGame() {
    this.zombies = [];
    this.walls = generateStoreWalls(this.canvas.width, this.canvas.height);
    this.spawnDoor = createSpawnDoor(
      this.canvas.width,
      this.canvas.height,
      this.walls,
    );
    const spawn = spawnPlayer(
      this.canvas.width,
      this.canvas.height,
      this.walls,
    );
    this.player.x = spawn.x;
    this.player.y = spawn.y;
    this.zombies = spawnZombieWave(
      5,
      this.spawnDoor,
      this.canvas.width,
      this.canvas.height,
      "normal",
      this.walls,
    );
    this.currentWave = 1;
    this.victory = false;
    this.hud.setWave(this.currentWave);
    this.hud.showWaveCounter();
    this.victoryDiv.style.display = "none";
    resetPlayerForNewGame(this.player, PLAYER_MAX_HEALTH);
    this.weapon = null;
    this.containers = spawnContainers(
      this.canvas.width,
      this.canvas.height,
      this.walls,
      15 + Math.floor(Math.random() * 6),
    );
    this.looting = null;
    this.lootTimer = 0;
    this.gameOver = false;
    this.gameOverDiv.style.display = "none";
    this.inventory = createInventory();
    this.worldItems = [];
    this.fireballs = [];
    this.fireOrbs = [];
    this.explosions = [];
    this.fireballCooldown = 0;
    if (this.player.abilities.fireball) {
      addItem(this.inventory, "fireball_spell", 1);
      const idx = this.inventory.slots.findIndex(
        (s) => s.item === "fireball_spell",
      );
      if (idx !== -1) moveToHotbar(this.inventory, idx, 0);
    }
    if (this.player.abilities.fireOrb) {
      this.fireOrbs = createOrbs(
        this.player.abilities.fireOrbLevel >= 2 ? 2 : 1,
      );
    }
    this.inventoryOpen = false;
    this.craftingOpen = false;
    this.inventoryDiv.style.display = "none";
    this.craftingDiv.style.display = "none";
    this.hud.clearPickupMessage();
    this.hud.setWave(this.currentWave);
    this.hud.showWaveCounter();
    this.renderInventory();
    this.renderHotbar();
  }

  handleSkillUpgrade() {
    const sel = this.skillTreeUI.getSelectedSkill();
    if (!sel) return;
    const upgrader = SKILL_UPGRADERS[sel.id];
    if (
      upgrader &&
      upgrader(this.player, this.inventory, addItem, moveToHotbar)
    ) {
      if (sel.id === "fire_orb_skill") {
        this.fireOrbs = createOrbs(
          this.player.abilities.fireOrbLevel >= 2 ? 2 : 1,
        );
      }
      this.renderInventory();
      this.renderHotbar();
      this.skillTreeUI.updateSkillDetails(this.player);
      this.skillTreeUI.renderSkillTree(this.player, SKILL_INFO);
    }
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;
    if (key === "i" || key === "e") this.toggleInventory(!this.inventoryOpen);
    if (key === "c") this.toggleCrafting(!this.craftingOpen);
    if (key === "k") this.toggleSkillTree(!this.skillTreeOpen);
    if (/^[1-5]$/.test(key)) {
      const idx = parseInt(key) - 1;
      setActiveHotbar(this.inventory, idx);
      this.renderHotbar();
    }
  }

  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.x = e.clientX - rect.left;
    this.mousePos.y = e.clientY - rect.top;
  }

  handleMouseDown(e) {
    if (e.button === 0) this.keys.mouse = true;
    if (e.button === 2) {
      this.keys.mouse2 = true;
      e.preventDefault();
    }
  }

  handleMouseUp(e) {
    if (e.button === 0) this.keys.mouse = false;
    if (e.button === 2) this.keys.mouse2 = false;
  }

  renderInventory() {
    this.inventoryUI.renderInventory(
      this.inventory,
      this.player,
      this.fireballCooldown,
      ITEM_ICONS,
      getItemCooldown,
    );
    if (this.craftingOpen)
      this.craftingUI.renderCrafting(
        this.inventory,
        this.player,
        ITEM_ICONS,
        this.worldItems,
      );
  }

  renderHotbar() {
    this.inventoryUI.renderHotbar(
      this.inventory,
      this.player,
      this.fireballCooldown,
      ITEM_ICONS,
      getItemCooldown,
    );
  }

  toggleInventory(open) {
    if (open === this.inventoryOpen) return;
    this.inventoryOpen = open;
    this.inventoryUI.toggleInventory(open);
    if (this.inventoryOpen) {
      this.renderInventory();
    }
  }

  toggleCrafting(open) {
    if (open === this.craftingOpen) return;
    this.craftingOpen = open;
    this.craftingUI.toggleCrafting(
      open,
      this.inventory,
      this.player,
      ITEM_ICONS,
      this.worldItems,
    );
  }

  renderSkillTree() {
    this.skillTreeUI.renderSkillTree(this.player, SKILL_INFO);
  }

  updateSkillDetails() {
    this.skillTreeUI.updateSkillDetails(this.player);
  }

  toggleSkillTree(open) {
    if (open === this.skillTreeOpen) return;
    this.skillTreeOpen = open;
    this.skillTreeUI.toggleSkillTree(open, this.player, SKILL_INFO);
  }

  update() {
    if (this.gameOver || this.victory) return;
    updateWalls(this.walls);
    updateZombies(
      this.zombies,
      this.player,
      this.walls,
      this.canvas.width,
      this.canvas.height,
    );
    this.hud.update();
  }

  render() {
    renderScene(this.ctx, {
      walls: this.walls,
      containers: this.containers,
      spawnDoor: this.spawnDoor,
      player: this.player,
      playerSprite: this.playerSprite,
      fireZombieSprite: this.fireZombieSprite,
      zombieSprite: this.zombieSprite,
      fireOrbs: this.fireOrbs,
      hud: this.hud,
      inventory: this.inventory,
      ITEM_IMAGES: this.ITEM_IMAGES,
      weapon: this.weapon,
      worldItems: this.worldItems,
      arrows: this.arrows,
      mousePos: this.mousePos,
      zombies: this.zombies,
      activeSlot: getActiveHotbarItem(this.inventory),
      fireballs: this.fireballs,
      explosions: this.explosions,
      bowAiming: this.bowAiming,
      cardboardBoxImg: this.cardboardBoxImg,
      countItem: () => {},
    });
  }
}
