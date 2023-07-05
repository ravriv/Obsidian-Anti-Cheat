import * as mc from "@minecraft/server";

let banList = [];
const world = mc.world;
const messages = new Map();
const maxLength = 100;
const illegalItems = ["light_block", "lit_smoker", "daylight_detector_inverted", "powered_comparator", "lit_blast_furnace", "lit_furnace", "camera", "end_gateway", "fire", "soul_fire", "frosted_ice", "flowing_lava", "unknown", "flowing_water", "barrier", "command_block", "chemistry_table", "debug_stick", "command_block_minecart", "repeating_command_block", "spawn_egg", "spawner", "structure_block", "structure_void", "info_update", "info_update2", "reserved3", "reserved4", "reserved6", "movingblock", "moving_block", "movingBlock", "invisiblebedrock", "invisible_bedrock", "bedrock", "glowingobsidian", "compoundcreator", "underwater_torch", "chemical_heat", "end_portal", "end_portal_frame", "colored_torch", "hard_stained_glass_pane", "hard_glass_pane", "allow", "chain_command_block", "client_request_placeholder_block", "deny", "npc_spawn", "stickyPistonArmCollision", "sticky_piston_arm_collision", "piston_arm_collision", "netherreactor", "mob_spawner", "border_block", "bubble_column", "jigsaw", "portal", "pumpkin_stem", "melon_stem", "lava", "water", "lit_redstonelamp", "powered repeater", "lit_redstone_ore", "lit_deepslate_redstone_ore", "standing_sign", "wall_sign", "pistonarmcollision", "stickypistonarmcollision", "chalkboard", "lava_cauldron", "border", "glow_stick", "reeds", "double_stone_slab", "double_wooden_slab", "monster_egg", "stone_monster_egg", "farmland"];
const container_blocks = ["minecraft:chest", "minecraft:trapped_chest", "minecraft:barrel", "minecraft:beacon", "minecraft:blast_furnace", "minecraft:brewing_stand", "minecraft:dispenser", "minecraft:dropper", "minecraft:hopper", "minecraft:jukebox", "minecraft:lectern", "minecraft:smoker"];

mc.system.events.beforeWatchdogTerminate.subscribe((event) => {
    event.cancel = true;
});

world.afterEvents.blockPlace.subscribe((event) => {
    // Triggered after a block is placed in the world

    const { block, player } = event;
    // Extract the block and player objects from the event

    let hasIllegalItems = false;
    // Flag to track whether the block contains illegal items

    const blockContainer = block.getComponent("inventory")?.container;
    // Retrieve the block's inventory container, if it exists

    if (blockContainer && container_blocks.includes(block.typeId)) {
        // Check if the block has an inventory component and its type is included in the container_blocks array

        for (let i = 0; i < blockContainer.size; i++) {
            // Loop through each item in the block's inventory container

            const item = blockContainer?.getItem(i);
            // Get the current item from the container

            if (item) {
                // Check if the item exists
                hasIllegalItems = true;
                // Set the flag to true, indicating the presence of illegal items
            }
        }
    }

    if (blockContainer && block.typeId.includes("shulker_box")) {
        // Check if the block is a shulker box

        for (let i = 0; i < blockContainer.size; i++) {
            // Loop through each item in the shulker box container

            const item = blockContainer?.getItem(i);
            // Get the current item from the container

            if (item) {
                // Check if the item exists

                const itemId = item.typeId.replace("minecraft:", "");
                // Get the item ID by removing the "minecraft:" prefix

                if (
                    illegalItems.includes(itemId) ||
                    itemId.endsWith("spawn_egg") ||
                    item.nameTag?.length > 32 ||
                    item.getLore()?.length > 0
                ) {
                    // Check various conditions to determine if the item is illegal
                    hasIllegalItems = true;
                    // Set the flag to true, indicating the presence of illegal items
                    break;
                }

                const enchantments = item.getComponent("enchantments").enchantments;
                const enchantmentIds = [];
                // Get the enchantments of the item and initialize an array to track enchantment IDs

                for (const enchantment of enchantments) {
                    // Loop through each enchantment of the item

                    if (enchantment.level > enchantment.type.maxLevel || enchantment.level <= 0 ||
                        !enchantments.canAddEnchantment(new mc.Enchantment(enchantment.type, 1)) ||
                        enchantmentIds.includes(enchantment.type.id)) {
                        // Check various conditions to determine if the enchantment is illegal
                        hasIllegalItems = true;
                        // Set the flag to true, indicating the presence of illegal items
                        break;
                    } else {
                        enchantmentIds.push(enchantment.type.id);
                        // Add the enchantment ID to the array for tracking
                    }
                }
            }
        }
    }

    if (hasIllegalItems && !player.isOp()) {
        // Check if there are illegal items and the player is not an operator

        if (!banList.includes(player.name)) {
            banList.push(player.name);
            // Add the player's name to the ban list if it's not already included
            updateBanList();
            // Update the ban list
        }

        block.setType(mc.MinecraftBlockTypes.air);
        // Set the block type to air
    }
});

world.afterEvents.blockBreak.subscribe((event) => {
    // Triggered after a block is broken in the world

    const player = event.player;
    // Get the player who broke the block

    const dimension = event.dimension;
    // Get the dimension in which the block was broken

    const block = event.block;
    // Get the broken block

    const gmc = world.getPlayers({
        excludeGameModes: [mc.GameMode.creative]
    });
    // Get all players in survival mode (excluding creative mode)

    for (const players of gmc) {
        // Loop through each player in survival mode

        if (!players.isOp()) {
            // Check if the player is not an operator

            let undoblock = false;
            // Flag to determine if the block should be undone

            player.blocksBroken = (player.blocksBroken || 0) + 1;
            // Increment the count of blocks broken by the player

            if (player.blocksBroken > 3) {
                // Check if the player has broken more than 3 blocks

                undoblock = true;
                // Set the flag to true, indicating the block should be undone

                if (!banList.includes(player.name)) {
                    // Check if the player's name is not already in the ban list
                    banList.push(player.name);
                    // Add the player's name to the ban list
                    updateBanList();
                    // Update the ban list
                }
            }

            if (undoblock) {
                // If the block should be undone

                const droppedItems = dimension.getEntities({
                    location: { x: block.location.x, y: block.location.y, z: block.location.z },
                    minDistance: 0,
                    maxDistance: 2,
                    type: "item"
                });
                // Get the dropped items near the location of the broken block

                for (const item of droppedItems) item.kill();
                // Remove the dropped items by killing their entities

                block.setPermutation(event.brokenBlockPermutation);
                // Set the permutation of the broken block to undo the break operation
            }
        }
    }
});

world.afterEvents.entitySpawn.subscribe((event) => {
    // Triggered after an entity is spawned in the world

    const entitycontainertypes = ["minecraft:chestboat", "minecraft:chest_minecart"];
    // Array of entity types that are considered as containers

    const blockspawn = ["minecraft:beehive", "minecraft:bee_nest", "minecraft:dispenser", "minecraft:flowing_water"];
    // Array of block types that can trigger entity removal

    const excludedentities = ["minecraft:axolotl", "minecraft:cod", "minecraft:salmon", "minecraft:pufferfish", "minecraft:tadpole", "minecraft:tropicalfish"];
    // Array of entity types that are excluded from removal

    const entity = event.entity;
    // Get the spawned entity

    const nearplayer = findnear(entity);
    // Find the nearest player to the entity

    if (nearplayer.isOp()) {
        // Check if the nearest player is an operator
        return;
        // If the player is an operator, return and do nothing
    }

    const x1 = { x: entity.location.x + 2, y: entity.location.y + 2, z: entity.location.z + 2 };
    const x2 = { x: entity.location.x - 2, y: entity.location.y - 2, z: entity.location.z - 2 };
    // Define the boundaries for checking nearby blocks

    const blocks = getBlocksBetween(x1, x2, entity.dimension);
    // Get the blocks within the defined boundaries in the entity's dimension

    const killentity = !excludedentities.includes(entity.typeId);
    // Check if the entity type is not excluded from removal

    const setblocktoair = killentity && blocks.some(block => blockspawn.includes(block.dimension.getBlock(block.position).typeId));
    // Check if the entity should be removed based on nearby blocks

    if (setblocktoair) {
        // If the entity should be removed

        blocks.forEach(block => {
            const blockType = block.dimension.getBlock(block.position);
            // Get the block at each position

            if (blockspawn.includes(blockType.typeId)) {
                // Check if the block type is included in the removal list
                blockType.setType(mc.MinecraftBlockTypes.air);
                // Set the block type to air
            }
        });
    }

    if (killentity && setblocktoair) {
        // If the entity should be removed and blocks were set to air
        cbe(nearplayer);
        // Call the cbe function to perform an action on the nearest player
        entity.kill();
        // Kill the entity
    } else if (entitycontainertypes.includes(entity.typeId)) {
        // If the entity is a container type

        const entityContainer = entity.getComponent("inventory").container;
        // Get the container component of the entity

        if (entityContainer.size !== entityContainer.emptySlotsCount) {
            // Check if the container is not empty

            for (let i = 0; i < entityContainer.size; i++) {
                // Loop through each slot in the container
                entityContainer.clearItem(i);
                // Clear the item in each slot
            }

            cbe(nearplayer);
            // Call the cbe function to perform an action on the nearest player
            entity.kill();
            // Kill the entity
        }
    }
});

function findnear(entity) {
    // Function to find the nearest player to an entity

    const nearestPlayer = [...entity.dimension.getPlayers({
        closest: 1,
        location: { x: entity.location.x, y: entity.location.y, z: entity.location.z },
    })][0];
    // Get the closest player to the entity's location

    return nearestPlayer;
    // Return the nearest player
}

function cbe(player) {
    // Function to perform an action on a player

    banList.push(player.name);
    // Add the player's name to the ban list
}

function getBlocksBetween(x1, x2, dimension) {
    // Function to get blocks between two positions in a dimension

    let blocks = [];
    // Initialize an empty array to store the blocks

    for (let x = Math.min(x1.x, x2.x); x <= Math.max(x1.x, x2.x); x++) {
        for (let y = Math.min(x1.y, x2.y); y <= Math.max(x1.y, x2.y); y++) {
            for (let z = Math.min(x1.z, x2.z); z <= Math.max(x1.z, x2.z); z++) {
                // Loop through each position within the defined boundaries

                blocks.push({ position: { x: x, y: y, z: z }, dimension: dimension });
                // Add the block position and dimension to the array
            }
        }
    }

    return blocks;
    // Return the array of blocks
}

mc.system.runInterval(() => {
    // Run the code at regular intervals

    const players = world.getPlayers({
        excludeGameModes: [mc.GameMode.creative]
    });
    // Get all players in the world, excluding those in creative mode

    for (const player of players) {
        // Iterate through each player

        if (!player.isOp()) {
            // Check if the player is not an operator

            player.blocksBroken = 0;
            // Reset the count of blocks broken by the player

            const playerContainer = player.getComponent("inventory").container;
            // Get the player's inventory container

            const illegalEnchantments = {};
            // Initialize an object to store illegal enchantments for each item

            let addToBanList = false;
            // Flag to determine if the player should be added to the ban list

            for (let i = 0; i < playerContainer.size; i++) {
                // Loop through each slot in the player's inventory

                const item = playerContainer.getItem(i);
                // Get the item in the current slot

                if (!item) continue;
                // If the slot is empty, skip to the next iteration

                const itemId = item.typeId.replace("minecraft:", "");
                // Get the ID of the item without the "minecraft:" prefix

                if (illegalItems.includes(itemId) || itemId.endsWith("spawn_egg")) {
                    // Check if the item is illegal or a spawn egg
                    if (player.isOp()) {
                        player.sendMessage(`§c§l§¶${player.name} obtained illegal item§r§¶\n${itemId}`);
                        // Send a message to op players notifying about the illegal item

                        playerContainer.setItem(i);
                        // Remove the illegal item from the player's inventory

                        addToBanList = true;
                        // Set the flag to add the player to the ban list

                        continue;
                        // Skip to the next iteration
                    }

                    if (item.nameTag?.length > 32 || item.getLore()?.length > 0) {
                        // Check if the item has a name tag longer than 32 characters or lore

                        playerContainer.setItem(i);
                        // Remove the item from the player's inventory

                        addToBanList = true;
                        // Set the flag to add the player to the ban list

                        continue;
                        // Skip to the next iteration
                    }

                    if (Math.abs(player.location.x) > 30000000 || Math.abs(player.location.y) > 30000000 || Math.abs(player.location.z) > 30000000) {
                        if (player.isOp()) {
                            player.sendMessage(`§c§l§¶${player.name} attemped to crash the world`);
                            // Check if the player's location exceeds the world border

                            addToBanList = true;
                            // Set the flag to add the player to the ban list
                        }

                        const enchantments = item.getComponent("enchantments").enchantments;
                        // Get the enchantments of the item

                        const enchantmentIds = [];
                        // Array to store unique enchantment IDs

                        for (const enchantment of enchantments) {
                            // Iterate through each enchantment of the item

                            if (enchantment.level > enchantment.type.maxLevel) {
                                // Check if the enchantment level exceeds the maximum allowed level

                                illegalEnchantments[itemId] = illegalEnchantments[itemId] || [];
                                illegalEnchantments[itemId].push(`${enchantment.type.id} level ${enchantment.level}`);
                                // Add the illegal enchantment to the list for the item
                            }

                            if (enchantment.level <= 0) {
                                // Check if the enchantment level is negative

                                illegalEnchantments[itemId] = illegalEnchantments[itemId] || [];
                                illegalEnchantments[itemId].push(`§¶§n${enchantment.type.id} level is negative§r`);
                                // Add the illegal enchantment to the list for the item
                            }

                            if (!enchantments.canAddEnchantment(new mc.Enchantment(enchantment.type, 1))) {
                                // Check if the enchantment is not supported by the item

                                illegalEnchantments[itemId] = illegalEnchantments[itemId] || [];
                                illegalEnchantments[itemId].push(`§¶§n${enchantment.type.id} is not supported§r`);
                                // Add the illegal enchantment to the list for the item
                            }

                            if (enchantmentIds.includes(enchantment.type.id)) {
                                // Check if the enchantment ID is already present

                                illegalEnchantments[itemId] = illegalEnchantments[itemId] || [];
                                illegalEnchantments[itemId].push(`§¶§n${enchantment.type.id} is duplicated§r`);
                                // Add the illegal enchantment to the list for the item
                            } else {
                                enchantmentIds.push(enchantment.type.id);
                                // Add the enchantment ID to the array of unique enchantment IDs
                            }
                        }

                        if (illegalEnchantments[itemId]) {
                            // Check if the item has any illegal enchantments

                            playerContainer.setItem(i);
                            // Remove the item from the player's inventory

                            addToBanList = true;
                            // Set the flag to add the player to the ban list
                        }
                    }

                    if (addToBanList && !banList.includes(player.name)) {
                        banList.push(player.name);
                        updateBanList();
                        // Add the player to the ban list and update it if necessary
                    }

                    for (const itemId in illegalEnchantments) {
                        const enchantmentList = illegalEnchantments[itemId].join(", ");
                        if (player.isOp()) {
                            player.sendMessage(`§c§l§¶${player.name} has illegal enchantments§r§¶\n${itemId}: ${enchantmentList}`);
                            // Send a message to op players notifying about the illegal enchantments of the player
                        }
                    }
                }
            }
        }
    }
});

world.afterEvents.worldInitialize.subscribe((event) => {
    // Subscribe to the worldInitialize event

    const def = new mc.DynamicPropertiesDefinition();
    // Create a new DynamicPropertiesDefinition object

    def.defineBoolean("first");
    def.defineString("banList", 9984);
    // Define two dynamic properties: "first" (boolean) and "banList" (string)

    event.propertyRegistry.registerWorldDynamicProperties(def);
    // Register the dynamic properties with the property registry

    if (!world.getDynamicProperty("first")) {
        // Check if it's the first time the world is initialized

        world.setDynamicProperty("banList", JSON.stringify({
            banList: []
        }));
        // Initialize the banList dynamic property as an empty array

        world.setDynamicProperty("first", true);
        // Set the "first" dynamic property to true to indicate initialization
    }

    banList = JSON.parse(world.getDynamicProperty("banList")).banList;
    // Retrieve the banList from the dynamic property and parse it as JSON

    mc.system.runInterval(() => {
        // Run the code at regular intervals

        for (const player of world.getPlayers().filter(p => !p.isOp())) {
            // Iterate through each non-operator player

            if (banList.includes(player.name)) {
                // Check if the player is in the ban list

                player.triggerEvent("run:kick");
                // Kick the player from the server
            }
        }
    });
});

function isSimilar(msg1, msg2) {
    // Function to check if two messages are similar

    return msg1 === msg2 || Math.abs(msg1.length - msg2.length) <= 1;
}

world.beforeEvents.chatSend.subscribe((event) => {
    // Subscribe to the chatSend event

    const { message: msg, sender: player } = event;
    // Extract the message and sender from the event

    if (msg.length > maxLength) {
        // Check if the message exceeds the maximum length

        event.cancel = true;
        // Cancel the event to prevent the message from being sent

        player.sendMessage(`§l§c§¶Your message is too long! The maximum length is ${maxLength} characters`);
        // Send a message to the player indicating the message length limit
        return;
    }

    if (!messages.get(player.name)) {
        // Check if the player has no previous message

        messages.set(player.name, { message: msg, timestamp: Date.now() });
        // Set the current message as the player's latest message
    } else {
        const oldMsgData = messages.get(player.name);
        // Retrieve the player's previous message data

        const timeDiff = Date.now() - oldMsgData.timestamp;
        // Calculate the time difference between the previous and current message

        if (isSimilar(oldMsgData.message, msg) && timeDiff < 5000) {
            // Check if the current message is similar to the previous one and sent within 5 seconds

            event.cancel = true;
            // Cancel the event to prevent the message from being sent
        } else {
            messages.set(player.name, { message: msg, timestamp: Date.now() });
            // Set the current message as the player's latest message
        }

        if (player.isOp()) {
            // Check if the player is an operator

            if (msg === ".banlist") {
                // Check if the player requests the ban list

                event.cancel = true;
                // Cancel the event to prevent the message from being sent

                const bannedPlayers = banList.join("\n");
                player.sendMessage(`§4§l§´Banned Players List§r\n${bannedPlayers}`);
                // Send the list of banned players to the player
            } else if (msg.startsWith(".ban ")) {
                // Check if the player wants to ban another player

                event.cancel = true;
                // Cancel the event to prevent the message from being sent

                const toBan = msg.trim().replace(".ban ", "");
                // Extract the name of the player to ban from the message

                if (banList.includes(toBan)) {
                    player.sendMessage(`§l§c§¶${toBan} is already banned`);
                    // Send a message to the player indicating that the player is already banned
                    return;
                }

                const playerToBan = [...world.getPlayers()].find(p => p.name === toBan);
                // Find the player to ban in the list of online players

                if (!playerToBan) {
                    player.sendMessage(`§c§l§¶${toBan} not found`);
                    // Send a message to the player indicating that the player to ban was not found
                    return;
                }
                if (playerToBan.isOp()) {
                    player.sendMessage("§c§lError:§r§c§¶ You can't ban players with operator permissions");
                    // Send a message to the player indicating that banning operators is not allowed
                    return;
                }

                banList.push(toBan);
                // Add the player to the ban list

                world.sendMessage("§c§l§¶" + toBan + " has been banned");
                // Send a message to the server indicating that the player has been banned

                updateBanList();
                // Update the ban list dynamic property
            } else if (msg.startsWith(".unban ")) {
                // Check if the player wants to unban a player

                event.cancel = true;
                // Cancel the event to prevent the message from being sent

                const playerToUnban = msg.trim().replace(".unban ", "");
                // Extract the name of the player to unban from the message

                if (!banList.includes(playerToUnban)) {
                    player.sendMessage(`§c§l§¶${playerToUnban} is not banned`);
                    // Send a message to the player indicating that the player is not banned
                    return;
                }

                const index = banList.indexOf(playerToUnban);
                // Find the index of the player to unban in the ban list

                if (index === -1) {
                    return;
                }

                banList.splice(index, 1);
                // Remove the player from the ban list

                world.sendMessage("§a§l§¶" + playerToUnban + " has been unbanned");
                // Send a message to the server indicating that the player has been unbanned

                updateBanList();
                // Update the ban list dynamic property
            }
        }
    }
});

world.afterEvents.playerLeave.subscribe(() => {
    // Subscribe to the playerLeave event

    updateBanList();
    // Update the ban list dynamic property
});

function updateBanList() {
    // Function to update the ban list dynamic property

    world.setDynamicProperty("banList", JSON.stringify({ banList: banList }));
    // Update the banList dynamic property with the current ban list
}
