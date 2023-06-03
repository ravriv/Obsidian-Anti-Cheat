import*as mc from"@minecraft/server";const illegalItems=["light_block","lit_smoker","daylight_detector_inverted","powered_comparator","lit_blast_furnace","lit_furnace","camera","end_gateway","fire","soul_fire","frosted_ice","flowing_lava","unknown","flowing_water","barrier","command_block","chemistry_table","debug_stick","command_block_minecart","repeating_command_block","spawn_egg","spawner","structure_block","structure_void","info_update","info_update2","reserved3","reserved4","reserved6","movingblock","moving_block","movingBlock","invisiblebedrock","invisible_bedrock","bedrock","glowingobsidian","compoundcreator","underwater_torch","chemical_heat","end_portal","end_portal_frame","colored_torch","hard_stained_glass_pane","hard_glass_pane","allow","chain_command_block","client_request_placeholder_block","deny","npc_spawn","stickyPistonArmCollision","sticky_piston_arm_collision","piston_arm_collision","netherreactor","mob_spawner","border_block","bubble_column","jigsaw","portal","pumpkin_stem","melon_stem","lava","water","lit_redstonelamp","powered repeater","lit_redstone_ore","lit_deepslate_redstone_ore","standing_sign","wall_sign","pistonarmcollision","stickypistonarmcollision","chalkboard","lava_cauldron","border","glow_stick","reeds","double_stone_slab","double_wooden_slab","monster_egg","stone_monster_egg","farmland"];mc.world.events.blockPlace.subscribe((e=>{const{block:n,player:t}=e,a=n.getComponent("inventory").container;let s=0,r=!1;a.size>27&&(s=a.size/2);for(let e=s;e<a.size;e++){const n=a?.getItem(e);if(!n)continue;const s=n.typeId.replace("minecraft:","");(illegalItems.includes(s)||s.endsWith("spawn_egg")||n.nameTag?.length>32||n.getLore()?.length>0)&&(t.hasTag("admin")||(a.setItem(e),r=!0));const o=n.getComponent("enchantments").enchantments;let i=!1;for(const e in mc.MinecraftEnchantmentTypes){const n=o.getEnchantment(mc.MinecraftEnchantmentTypes[e]);if(!n)continue;const t=()=>{o.removeEnchantment(n.type),i=!0};0!==o.slot||o.canAddEnchantment(n)?(n.level>n.type.maxLevel||n.level<=0)&&(t(),r=!0):(t(),r=!0)}r&&!t.hasTag("admin")&&t.addTag("ban")}})),mc.system.runInterval((()=>{const e=JSON.parse(mc.world.getDynamicProperty("banList")||'{"banList": []}').banList;for(const e of mc.world.getPlayers({excludeTags:["admin"]})){const n=e.getComponent("inventory").container,t={};for(let a=0;a<n.size;a++){const s=n.getItem(a);if(!s)continue;const r=s.typeId.replace("minecraft:","");if(illegalItems.includes(r)||r.endsWith("spawn_egg")){mc.world.sendMessage(`§c§l§¶${e.name} obtained illegal item§r§¶\n${r}`),n.setItem(a),e.addTag("ban");continue}if(s.nameTag?.length>32||s.getLore()?.length>0){n.setItem(a),e.addTag("ban");continue}const o=s.getComponent("enchantments").enchantments;let i=!1;for(const n in mc.MinecraftEnchantmentTypes){const a=o.getEnchantment(mc.MinecraftEnchantmentTypes[n]);if(!a)continue;const s=()=>{o.removeEnchantment(a.type),i=!0};if(0!==o.slot||o.canAddEnchantment(a)){if(a.level>a.type.maxLevel||a.level<=0){const n=`${a.type.id} level ${a.level}/${a.type.maxLevel}`;t[r]=t[r]||[],t[r].push(n),s(),e.addTag("ban")}}else{const n=`${a.type.id} level ${a.level}`;t[r]=t[r]||[],t[r].push(n),s(),e.addTag("ban")}}i&&(s.getComponent("enchantments").enchantments=o,n.setItem(a))}for(const n in t){const a=t[n].join(", "),s=`§c§l§¶${e.name} has illegal enchantments§r§¶\n${n}: ${a}`;mc.world.sendMessage(s)}}for(const n of mc.world.getPlayers({tags:["ban"]}))n.hasTag("admin")?n.removeTag("ban"):e.includes(n.name)||e.push(n.name);mc.world.setDynamicProperty("banList",JSON.stringify({banList:e}))})),mc.world.events.worldInitialize.subscribe((e=>{const n=new mc.DynamicPropertiesDefinition;n.defineBoolean("first"),n.defineString("banList",9984),e.propertyRegistry.registerWorldDynamicProperties(n),mc.world.getDynamicProperty("first")||(mc.world.setDynamicProperty("banList",JSON.stringify({banList:[]})),mc.world.setDynamicProperty("first",!0))})),mc.world.events.beforeChat.subscribe((e=>{const{message:n,sender:t}=e;mc.world.getDynamicProperty("first")||(mc.world.setDynamicProperty("banList",JSON.stringify({banList:[]})),mc.world.setDynamicProperty("first",!0));const a=JSON.parse(mc.world.getDynamicProperty("banList")).banList;if(".banlist"===n&&t.hasTag("admin")){const n=a.join("\n");e.cancel=!0,t.sendMessage(`§4§l§´Banned Players List§r\n${n}`)}if(n.startsWith(".ban ")&&t.hasTag("admin")){const s=n.trim().replace(".ban ","");if(e.cancel=!0,a.includes(s))return void t.sendMessage(`§l§c§¶${s} is already banned`);const r=[...mc.world.getPlayers()].find((e=>e.name===s));if(!r)return void t.sendMessage(`§c§l§¶${s} not found`);if(r.hasTag("admin"))return void t.sendMessage("§c§lError:§r§c§¶ You can't ban players with admin tag");a.push(s),mc.world.sendMessage("§c§l§¶"+s+" has been banned")}if(n.startsWith(".unban ")&&t.hasTag("admin")){const s=n.trim().replace(".unban ","");if(e.cancel=!0,!a.includes(s))return void t.sendMessage(`§c§l§¶${s} is not banned`);const r=a.indexOf(s);if(-1===r)return;a.splice(r,1),mc.world.sendMessage("§a§l§¶"+s+" has been unbanned")}mc.world.setDynamicProperty("banList",JSON.stringify({banList:a}))})),mc.system.runInterval((()=>{for(const e of mc.world.getPlayers({excludeTags:["admin"]}))JSON.parse(mc.world.getDynamicProperty("banList")).banList.includes(e.name)&&e.triggerEvent("run:kick")}));
