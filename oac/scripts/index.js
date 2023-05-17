import {
  system,
  world,
  DynamicPropertiesDefinition,
  MinecraftEnchantmentTypes
} from "@minecraft/server";

const illegalItems = ["light_block", "lit_smoker", "daylight_detector_inverted", "powered_comparator", "lit_blast_furnace", "lit_furnace", "camera", "end_gateway", "fire", "soul_fire", "frosted_ice", "flowing_lava", "unknown", "flowing_water", "barrier", "command_block", "chemistry_table", "debug_stick", "command_block_minecart", "repeating_command_block", "spawn_egg", "spawner", "structure_block", "structure_void", "info_update", "info_update2", "reserved3", "reserved4", "reserved6", "movingblock", "moving_block", "movingBlock", "invisiblebedrock", "invisible_bedrock", "bedrock", "glowingobsidian", "compoundcreator", "underwater_torch", "chemical_heat", "end_portal", "end_portal_frame", "colored_torch", "hard_stained_glass_pane", "hard_glass_pane", "allow", "chain_command_block", "client_request_placeholder_block", "deny", "npc_spawn", "stickyPistonArmCollision", "sticky_piston_arm_collision", "piston_arm_collision", "netherreactor", "mob_spawner", "border_block", "bubble_column", "jigsaw", "portal", "pumpkin_stem", "melon_stem", "lava", "water", "lit_redstonelamp", "powered repeater", "lit_redstone_ore", "lit_deepslate_redstone_ore", "standing_sign", "wall_sign", "pistonarmcollision", "stickypistonarmcollision", "chalkboard", "lava_cauldron", "border", "glow_stick", "reeds", "double_stone_slab", "double_wooden_slab", "monster_egg", "stone_monster_egg", "farmland"];

system.runInterval(() => {
  let banList = JSON.parse(world.getDynamicProperty("banList") || '{"banList": []}').banList;

  for (const player of world.getPlayers({ excludeTags: ['admin'] })) {
    const container = player.getComponent("inventory").container;
    const illegalEnchantments = {};

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);

      if (!item) continue;

      const itemId = item.typeId;
      const itemIdWithoutNamespace = itemId.replace('minecraft:', '');

      if (item.nameTag?.length > 32 || item.getLore()?.length > 0) {
        container.setItem(i);
        player.addTag('ban');
        continue;
      }

      if (illegalItems.includes(itemId) || itemId.endsWith('spawn_egg')) {
        world.sendMessage(`§c§l§´${player.name} obtained illegal item§r§´\n${itemId}`);
        container.setItem(i);
        player.addTag('ban');
        continue;
      }

      const enchants = item.getComponent("enchantments")["enchantments"];
      let flagged = false;

      for (const enchant in MinecraftEnchantmentTypes) {
        const enchantmentValue = enchants.getEnchantment(MinecraftEnchantmentTypes[enchant]);

        if (!enchantmentValue) continue;

        const clear = () => {
          enchants.removeEnchantment(enchantmentValue.type);
          flagged = true;
        };

        if (enchants.slot == 0 && !enchants.canAddEnchantment(enchantmentValue)) {
          const illegalEnchantmentString = `${enchantmentValue.type.id} level ${enchantmentValue.level}`;
          illegalEnchantments[itemIdWithoutNamespace] = illegalEnchantments[itemIdWithoutNamespace] || [];
          illegalEnchantments[itemIdWithoutNamespace].push(illegalEnchantmentString);
          clear();
          player.addTag("ban");
        } else if (enchantmentValue.level > enchantmentValue.type.maxLevel || enchantmentValue.level <= 0) {
          const illegalEnchantmentString = `${enchantmentValue.type.id} level ${enchantmentValue.level}/${enchantmentValue.type.maxLevel}`;
          illegalEnchantments[itemIdWithoutNamespace] = illegalEnchantments[itemIdWithoutNamespace] || [];
          illegalEnchantments[itemIdWithoutNamespace].push(illegalEnchantmentString);
          clear();
          player.addTag('ban');
        }
      }

      if (!flagged) continue;

      item.getComponent("enchantments")["enchantments"] = enchants;
      container.setItem(i);
    }

    for (const itemId in illegalEnchantments) {
      const enchantmentList = illegalEnchantments[itemId].join(', ');
      const message = `§c§l§´${player.name} has illegal enchantments§r§´\n${itemId}: ${enchantmentList}`;
      world.sendMessage(message);
    }
  }

  for (const player of world.getPlayers({ 'tags': ['ban'] })) {
    if (player.hasTag('admin')) {
      player.removeTag('ban');
    } else {
      if (!banList.includes(player.name)) {
        banList.push(player.name);
      }
    }
  }

  world.setDynamicProperty("banList", JSON.stringify({ 'banList': banList }));
});

world.events.worldInitialize.subscribe(event => {
  const def = new DynamicPropertiesDefinition();
  def.defineBoolean("first");
  def.defineString('banList', 9984);
  event.propertyRegistry.registerWorldDynamicProperties(def);

  if (!world.getDynamicProperty('first')) {
    world.setDynamicProperty("banList", JSON.stringify({ 'banList': [] }));
    world.setDynamicProperty('first', true);
  }
});

world.events.beforeChat.subscribe(event => {
  const { message: msg, sender: player } = event;

  if (!world.getDynamicProperty('first')) {
    world.setDynamicProperty("banList", JSON.stringify({ 'banList': [] }));
    world.setDynamicProperty('first', true);
  }

  const banList = JSON.parse(world.getDynamicProperty("banList")).banList;

  if (msg === '.banlist' && player.hasTag("admin")) {
    const bannedPlayers = banList.join(', ');
    event.cancel = true;
    player.sendMessage('§4§l§´Banned Players List§r\n' + bannedPlayers);
  }

  if (msg.startsWith('.ban ') && player.hasTag("admin")) {
    const toBan = msg.trim().replace('.ban ', '');
    event.cancel = true;
    const playerToBan = [...world.getPlayers({ 'name': toBan })][0];

    if (!playerToBan) return;
    if (playerToBan.hasTag('admin')) return player.sendMessage('§c§lError:§c§´ You can\'t ban players with admin tag');
    if (banList.includes(toBan)) return;

    banList.push(toBan);
    world.sendMessage('§c§l§´' + toBan + ' has been banned');
  }

  if (msg.startsWith('.unban ') && player.hasTag("admin")) {
    const playerToUnban = msg.trim().replace('.unban ', '');
    event.cancel = true;

    if (!banList.includes(playerToUnban)) return;

    const index = banList.indexOf(playerToUnban);
    if (index === -1) return;

    banList.splice(index, 1);
    world.sendMessage('§a§l§´' + playerToUnban + ' has been unbanned');
  }

  world.setDynamicProperty("banList", JSON.stringify({ 'banList': banList }));
});

system.runInterval(() => {
  for (const player of world.getPlayers({ 'excludeTags': ['admin'] })) {
    if (JSON.parse(world.getDynamicProperty("banList")).banList.includes(player.name)) {
      player.triggerEvent('run:kick');
    }
  }
});