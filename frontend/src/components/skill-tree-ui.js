export function createSkillTreeUI(
  {
    skillTreeDiv,
    skillTreeBar,
    skillTreeClose,
    skillPointsDiv,
    skillGrid,
    skillDetails,
    skillNameDiv,
    skillDescDiv,
    skillLevelsDiv,
    skillLevelDiv,
    skillCostDiv,
    skillUpgradeBtn,
    skillTreePos,
  },
  itemIcons,
) {
  let open = false;
  let selectedSkill = null;

  function renderSkillTree(player, skillInfo) {
    skillPointsDiv.textContent = `Fire Mutation Points Available: ${player.fireMutationPoints}`;
    skillGrid.innerHTML = "";
    const skills = skillInfo.map((info) => ({
      ...info,
      level: player.abilities[info.levelKey] || 0,
    }));
    skills.forEach((s) => {
      const tile = document.createElement("div");
      const nextCost = s.level < s.max ? s.costs[s.level + 1] : null;
      tile.className = "skill-node";
      if (s.level >= s.max) tile.classList.add("maxed");
      else if (s.level > 0) tile.classList.add("unlocked");
      else tile.classList.add("locked");
      if (nextCost && player.fireMutationPoints >= nextCost) {
        tile.classList.add("available");
      }
      if (selectedSkill && selectedSkill.id === s.id) {
        tile.style.outline = "2px solid yellow";
      }
      const img = document.createElement("img");
      img.src = itemIcons[s.id];
      img.style.width = "48px";
      img.style.height = "48px";
      img.style.opacity = s.level > 0 ? 1 : 0.5;
      tile.appendChild(img);
      const label = document.createElement("div");
      label.style.fontSize = "12px";
      label.textContent = `Lv ${s.level}/${s.max}`;
      tile.appendChild(label);
      tile.addEventListener("mousedown", () => {
        selectedSkill = s;
        updateSkillDetails(player);
        renderSkillTree(player, skillInfo);
      });
      skillGrid.appendChild(tile);
    });
  }

  function updateSkillDetails(player) {
    if (!selectedSkill) {
      skillDetails.style.display = "none";
      return;
    }
    const level = selectedSkill.level;
    const nextCost =
      level < selectedSkill.max ? selectedSkill.costs[level + 1] : null;
    skillNameDiv.textContent = selectedSkill.name;
    skillDescDiv.textContent = selectedSkill.description;
    skillLevelsDiv.innerHTML = "";
    if (selectedSkill.levels) {
      selectedSkill.levels.forEach((lv, idx) => {
        const li = document.createElement("li");
        li.textContent = `Lv ${idx + 1}: ${lv.effect} (Cost: ${lv.cost})`;
        skillLevelsDiv.appendChild(li);
      });
    }
    skillLevelDiv.textContent = `Level ${level}/${selectedSkill.max}`;
    skillCostDiv.textContent = nextCost ? `Cost: ${nextCost}` : "Max level";
    skillUpgradeBtn.textContent = level === 0 ? "Unlock" : "Upgrade";
    skillDetails.style.display = "block";
  }

  function toggleSkillTree(flag, player, skillInfo) {
    if (flag === open) return;
    open = flag;
    if (open) {
      if (skillTreePos.left !== null) {
        skillTreeDiv.style.left = skillTreePos.left + "px";
        skillTreeDiv.style.top = skillTreePos.top + "px";
        skillTreeDiv.style.transform = "none";
      } else {
        skillTreeDiv.style.left = "50%";
        skillTreeDiv.style.top = "50%";
        skillTreeDiv.style.transform = "translate(-50%, -50%)";
      }
      skillTreeDiv.style.display = "block";
      renderSkillTree(player, skillInfo);
    } else {
      skillTreePos.left = skillTreeDiv.offsetLeft;
      skillTreePos.top = skillTreeDiv.offsetTop;
      skillTreeDiv.style.display = "none";
      selectedSkill = null;
      updateSkillDetails(player);
    }
  }

  skillUpgradeBtn.addEventListener("click", () => {
    if (!selectedSkill) return;
    if (onUpgrade) onUpgrade(selectedSkill);
  });

  let onUpgrade = null;
  function setUpgradeHandler(fn) {
    onUpgrade = fn;
  }

  return {
    renderSkillTree,
    updateSkillDetails,
    toggleSkillTree,
    setUpgradeHandler,
    getSelectedSkill: () => selectedSkill,
    isOpen: () => open,
  };
}
