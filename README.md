# Obsidian-Anti-Cheat
###Introducing Obsidian Anti Cheat: Unleash the Power of Simplicity for Minecraft Bedrock Realms, Worlds, and Servers!
Importing Dependencies: The script imports various dependencies from the @minecraft/server package, including system, world, DynamicPropertiesDefinition, and MinecraftEnchantmentTypes.

Illegal Items: An array named illegalItems is defined, which contains the identifiers of items that are considered illegal.

Main Logic: The script uses system.runInterval to run a function periodically. Inside this function, the following steps are executed for each player:

a. Getting the Player's Inventory: The player's inventory container is obtained using player.getComponent("inventory").container.

b. Checking for Illegal Actions:

The script checks if an item has an invalid name tag length or lore and removes it from the player's inventory if it does.
It also checks if the item's identifier is in the illegalItems array or if it ends with "spawn_egg". If so, it sends a message to the world indicating that the player obtained an illegal item and removes it from the player's inventory.
Additionally, the script checks for illegal enchantments on the item. If an enchantment is invalid (e.g., exceeds the maximum level or has a negative level), it removes the enchantment and adds the item to the player's ban list.
c. Handling Illegal Enchantments: If any illegal enchantments are found on the item, they are recorded in the illegalEnchantments object, which maps item identifiers to arrays of illegal enchantments.

d. Fixing Enchantments: If any enchantments were removed, the script updates the item's enchantments in the player's inventory container.

e. Notifying Illegal Enchantments: After checking all the player's items, if there are any illegal enchantments in the illegalEnchantments object, a message is sent to the world indicating the player's name and the illegal enchantments they possess.

Updating the Ban List: The script iterates over all players with the "ban" tag and either removes the tag (if the player has the "admin" tag) or adds the player's name to the banList array. The banList array is then saved to the dynamic property "banList".

Initialization: On world initialization, the script registers the "banList" dynamic property and initializes it as an empty array if it hasn't been set before.

Chat Events:

Before sending a chat message, the script checks if the "banList" dynamic property is set. If not, it initializes it as an empty array.
If a player with the "admin" tag sends the ".banlist" command, the script cancels the event, retrieves the ban list from the dynamic property, and sends it back to the player.
If a player with the "admin" tag sends the ".ban" command followed by a player's name, the script cancels the event, adds the specified player to the ban list (if not already present), and sends a notification to the world.
If a player with the "admin" tag sends the ".unban" command followed by a player's name, the script cancels the event, removes the specified player from the ban list (if present), and sends a notification to the world.
Player Kick: Another periodic function is set up to run at intervals. This function checks all players (excluding those with the "admin" tag) and kicks them.
Initialization and Event Registration: The script initializes the banList dynamic property as an empty array if it hasn't been set before. It also registers event handlers for chat events and player join events.

Chat Events: When a player sends a chat message, the script checks if the player's name is in the banList array. If so, it cancels the chat event and kicks the player from the server.

Player Join Events: When a player joins the server, the script checks if their name is in the banList array. If so, it kicks the player from the server.

Obsidian Anti Cheat system works based on the provided code. It periodically checks players' inventories for illegal items, invalid enchantments, and other conditions. It maintains a ban list of players who have been flagged for cheating and kicks them from the server if they try to join or send chat messages. Additionally, it provides commands for administrators to manage the ban list.
