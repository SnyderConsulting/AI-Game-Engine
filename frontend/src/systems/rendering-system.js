export function drawSprite(ctx, img, x, y, facing, size = 32) {
  const angle = Math.atan2(facing.y, facing.x) - Math.PI / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

import { WALL_IMAGES } from "../walls.js";
import { fireballStats, predictFireballEndpoint } from "../spells.js";
import { predictArrowEndpoint } from "../entities/arrow.js";
import { renderZombies } from "../entities/zombie.js";
import { SEGMENT_SIZE } from "../game_logic.js";

export function render(ctx, state) {
  const {
    walls,
    containers,
    spawnDoor,
    player,
    playerSprite,
    fireZombieSprite,
    zombieSprite,
    fireOrbs,
    hud,
    inventory,
    ITEM_IMAGES,
    weapon,
    worldItems,
    arrows,
    mousePos,
    zombies,
    activeSlot,
    fireballs,
    explosions,
    bowAiming,
    cardboardBoxImg,
    countItem,
  } = state;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  walls.forEach((w) => {
    const img = WALL_IMAGES[w.material];
    if (img && img.complete) {
      ctx.globalAlpha = w.opened ? 0.5 : 1;
      ctx.drawImage(img, w.x, w.y, SEGMENT_SIZE, SEGMENT_SIZE);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "gray";
      ctx.fillRect(w.x, w.y, SEGMENT_SIZE, SEGMENT_SIZE);
    }
    if (w.damageTimer > 0) {
      ctx.fillStyle = "rgba(255,0,0,0.5)";
      ctx.fillRect(w.x, w.y, SEGMENT_SIZE, SEGMENT_SIZE);
    }
    if (w.hp < w.maxHp) {
      ctx.fillStyle = "red";
      ctx.fillRect(w.x, w.y - 6, SEGMENT_SIZE, 4);
      ctx.fillStyle = "lime";
      ctx.fillRect(w.x, w.y - 6, (w.hp / w.maxHp) * SEGMENT_SIZE, 4);
    }
  });
  containers.forEach((c) => {
    ctx.globalAlpha = c.opened ? 0.5 : 1;
    ctx.drawImage(cardboardBoxImg, c.x - 10, c.y - 10, 20, 20);
    ctx.globalAlpha = 1;
  });
  if (spawnDoor) {
    ctx.fillStyle = "brown";
    ctx.fillRect(spawnDoor.x - 5, spawnDoor.y - 5, 10, 10);
  }

  drawSprite(ctx, playerSprite, player.x, player.y, player.facing);

  if (player.abilities.fireOrb) {
    ctx.fillStyle = "orange";
    fireOrbs.forEach((o) => {
      if (o.cooldown <= 0) {
        ctx.beginPath();
        ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  if (player.swingTimer > 0) {
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 3;
    const startA = Math.atan2(player.facing.y, player.facing.x) - Math.PI / 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 25, startA, startA + Math.PI / 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  hud.render(ctx, player, inventory, countItem);

  if (weapon) {
    const img = ITEM_IMAGES[weapon.type];
    if (img) {
      ctx.drawImage(img, weapon.x - 8, weapon.y - 8, 16, 16);
    } else {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(weapon.x, weapon.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "yellow";
  worldItems.forEach((it) => {
    ctx.beginPath();
    ctx.arc(it.x, it.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "brown";
  arrows.forEach((a) => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  if (bowAiming) {
    const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
    const end = predictArrowEndpoint(player.x, player.y, dir, walls, zombies);
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (
    activeSlot &&
    activeSlot.item === "fireball_spell" &&
    player.abilities.fireball
  ) {
    const dir = { x: mousePos.x - player.x, y: mousePos.y - player.y };
    const end = predictFireballEndpoint(
      player.x,
      player.y,
      dir,
      walls,
      zombies,
    );
    ctx.strokeStyle = "rgba(255,0,0,0.6)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([2, 4]);
    const { radius } = fireballStats(player.abilities.fireballLevel);
    ctx.beginPath();
    ctx.arc(end.x, end.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "orange";
  fireballs.forEach((fb) => {
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(255,0,0,0.5)";
  explosions.forEach((ex) => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  renderZombies(ctx, zombies, zombieSprite, fireZombieSprite);
}
