import * as mc from "@minecraft/server";

mc.world.events.blockPlace.subscribe((b) => {
	const { block, player } = b;
	const container = block.getComponent("inventory").container;
	let startNumber = 0;
	let Items = false;

	if (container.size > 27) {
		startNumber = container.size / 2;
	}

	for (let i = startNumber; i < container.size; i++) {
		const item = container.getItem(i);

		if (!item) {
			continue;
		}

		container.setItem(i);
		Items = true;
	}

	if (Items) {
		player.addTag('ban');
	}
});

mc.system.runInterval(() => {
	let banList = JSON.parse(mc.world.getDynamicProperty("banList") || '{"banList": []}').banList;

	for (const player of mc.world.getPlayers({ excludeTags: ['admin'] })) {
		const container = player.getComponent("inventory").container;
		const illegalEnchantments = {};
		const illegalItems = ["light_block", "lit_smoker", "daylight_detector_inverted", "powered_comparator", "lit_blast_furnace", "lit_furnace", "camera", "end_gateway", "fire", "soul_fire", "frosted_ice", "flowing_lava", "unknown", "flowing_water", "barrier", "command_block", "chemistry_table", "debug_stick", "command_block_minecart", "repeating_command_block", "spawn_egg", "spawner", "structure_block", "structure_void", "info_update", "info_update2", "reserved3", "reserved4", "reserved6", "movingblock", "moving_block", "movingBlock", "invisiblebedrock", "invisible_bedrock", "bedrock", "glowingobsidian", "compoundcreator", "underwater_torch", "chemical_heat", "end_portal", "end_portal_frame", "colored_torch", "hard_stained_glass_pane", "hard_glass_pane", "allow", "chain_command_block", "client_request_placeholder_block", "deny", "npc_spawn", "stickyPistonArmCollision", "sticky_piston_arm_collision", "piston_arm_collision", "netherreactor", "mob_spawner", "border_block", "bubble_column", "jigsaw", "portal", "pumpkin_stem", "melon_stem", "lava", "water", "lit_redstonelamp", "powered repeater", "lit_redstone_ore", "lit_deepslate_redstone_ore", "standing_sign", "wall_sign", "pistonarmcollision", "stickypistonarmcollision", "chalkboard", "lava_cauldron", "border", "glow_stick", "reeds", "double_stone_slab", "double_wooden_slab", "monster_egg", "stone_monster_egg", "farmland"];

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);

			if (!item) {
				continue;
			}

			const itemId = item.typeId;
			const iIWNS = itemId.replace('minecraft:', '');

			if (item.nameTag?.length > 32 || item.getLore()?.length > 0) {
				container.setItem(i);
				player.addTag('ban');
				continue;
			}

			if (illegalItems.includes(itemId) || itemId.endsWith('spawn_egg')) {
				mc.world.sendMessage(`§c§l§´${player.name} obtained illegal item§r§´\n${itemId}`);
				container.setItem(i);
				player.addTag('ban');
				continue;
			}

			const enchants = item.getComponent("enchantments")["enchantments"];
			let flagged = false;

			for (const enchant in mc.MinecraftEnchantmentTypes) {
				const enchantmentValue = enchants.getEnchantment(mc.MinecraftEnchantmentTypes[enchant]);

				if (!enchantmentValue) {
					continue;
				}

				const clear = () => {
					enchants.removeEnchantment(enchantmentValue.type);
					flagged = true;
				};

				if (enchants.slot == 0 && !enchants.canAddEnchantment(enchantmentValue)) {
					const illegalEnchantmentString = `${enchantmentValue.type.id} level ${enchantmentValue.level}`;
					illegalEnchantments[iIWNS] = illegalEnchantments[iIWNS] || [];
					illegalEnchantments[iIWNS].push(illegalEnchantmentString);
					clear();
					player.addTag("ban");
				} else if (enchantmentValue.level > enchantmentValue.type.maxLevel || enchantmentValue.level <= 0) {
					const illegalEnchantmentString = `${enchantmentValue.type.id} level ${enchantmentValue.level}/${enchantmentValue.type.maxLevel}`;
					illegalEnchantments[iIWNS] = illegalEnchantments[iIWNS] || [];
					illegalEnchantments[iIWNS].push(illegalEnchantmentString);
					clear();
					player.addTag('ban');
				}
			}

			if (!flagged) {
				continue;
			}

			item.getComponent("enchantments")["enchantments"] = enchants;
			container.setItem(i);
		}

		for (const itemId in illegalEnchantments) {
			const enchantmentList = illegalEnchantments[itemId].join(', ');
			const message = `§c§l§´${player.name} has illegal enchantments§r§´\n${itemId}: ${enchantmentList}`;
			mc.world.sendMessage(message);
		}
	}

	for (const player of mc.world.getPlayers({ tags: ['ban'] })) {
		if (player.hasTag('admin')) {
			player.removeTag('ban');
		} else {
			if (!banList.includes(player.name)) {
				banList.push(player.name);
			}
		}
	}

	mc.world.setDynamicProperty("banList", JSON.stringify({ 'banList': banList }));
});

mc.world.events.worldInitialize.subscribe(event => {
	const def = new mc.DynamicPropertiesDefinition();
	def.defineBoolean("first");
	def.defineString('banList', 9984);
	event.propertyRegistry.registerWorldDynamicProperties(def);

	if (!mc.world.getDynamicProperty('first')) {
		mc.world.setDynamicProperty("banList", JSON.stringify({ 'banList': [] }));
		mc.world.setDynamicProperty('first', true);
	}
});

mc.world.events.beforeChat.subscribe(event => {
	const { message: msg, sender: player } = event;

	if (!mc.world.getDynamicProperty('first')) {
		mc.world.setDynamicProperty("banList", JSON.stringify({ 'banList': [] }));
		mc.world.setDynamicProperty('first', true);
	}

	const banList = JSON.parse(mc.world.getDynamicProperty("banList")).banList;

	if (msg === '.banlist' && player.hasTag("admin")) {
		const bannedPlayers = banList.join(', ');
		event.cancel = true;
		player.sendMessage('§4§l§´Banned Players List§r\n' + bannedPlayers);
	}

	if (msg.startsWith('.ban ') && player.hasTag("admin")) {
		const toBan = msg.trim().replace('.ban ', '');
		event.cancel = true;
		const playerToBan = [...mc.world.getPlayers({ 'name': toBan })][0];

		if (!playerToBan) {
			return;
		}
		if (playerToBan.hasTag('admin')) {
			return player.sendMessage('§c§lError:§c§´ You can\'t ban players with admin tag');
		}
		if (banList.includes(toBan)) {
			return;
		}

		banList.push(toBan);
		mc.world.sendMessage('§c§l§´' + toBan + ' has been banned');
	}

	if (msg.startsWith('.unban ') && player.hasTag("admin")) {
		const playerToUnban = msg.trim().replace('.unban ', '');
		event.cancel = true;

		if (!banList.includes(playerToUnban)) {
			return;
		}

		const index = banList.indexOf(playerToUnban);
		if (index === -1) {
			return;
		}

		banList.splice(index, 1);
		mc.world.sendMessage('§a§l§´' + playerToUnban + ' has been unbanned');
	}

	mc.world.setDynamicProperty("banList", JSON.stringify({ 'banList': banList }));
});

mc.system.runInterval(() => {
	for (const player of mc.world.getPlayers({ 'excludeTags': ['admin'] })) {
		if (JSON.parse(mc.world.getDynamicProperty("banList")).banList.includes(player.name)) {
			player.triggerEvent('run:kick');
		}
	}
});