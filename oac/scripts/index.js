import*as mc from"@minecraft/server";const illegalItems=["light_block","lit_smoker","daylight_detector_inverted","powered_comparator","lit_blast_furnace","lit_furnace","camera","end_gateway","fire","soul_fire","frosted_ice","flowing_lava","unknown","flowing_water","barrier","command_block","chemistry_table","debug_stick","command_block_minecart","repeating_command_block","spawn_egg","spawner","structure_block","structure_void","info_update","info_update2","reserved3","reserved4","reserved6","movingblock","moving_block","movingBlock","invisiblebedrock","invisible_bedrock","bedrock","glowingobsidian","compoundcreator","underwater_torch","chemical_heat","end_portal","end_portal_frame","colored_torch","hard_stained_glass_pane","hard_glass_pane","allow","chain_command_block","client_request_placeholder_block","deny","npc_spawn","stickyPistonArmCollision","sticky_piston_arm_collision","piston_arm_collision","netherreactor","mob_spawner","border_block","bubble_column","jigsaw","portal","pumpkin_stem","melon_stem","lava","water","lit_redstonelamp","powered repeater","lit_redstone_ore","lit_deepslate_redstone_ore","standing_sign","wall_sign","pistonarmcollision","stickypistonarmcollision","chalkboard","lava_cauldron","border","glow_stick","reeds","double_stone_slab","double_wooden_slab","monster_egg","stone_monster_egg","farmland"],container_blocks=["minecraft:chest","minecraft:trapped_chest","minecraft:barrel","minecraft:beacon","minecraft:blast_furnace","minecraft:brewing_stand","minecraft:dispenser","minecraft:dropper","minecraft:hopper","minecraft:jukebox","minecraft:lectern","minecraft:smoker"],enchantmentSlots={0:[],1:["protection","fireProtection","blastProtection","projectileProtection","thorns","respiration","aquaAffinity","unbreaking","mending","binding","vanishing"],2:["protection","fireProtection","blastProtection","projectileProtection","thorns","unbreaking","mending","binding","vanishing"],4:["protection","fireProtection","featherFalling","blastProtection","projectileProtection","thorns","depthStrider","unbreaking","frostWalker","mending","binding","vanishing","soulSpeed"],8:["protection","fireProtection","blastProtection","projectileProtection","thorns","unbreaking","swiftSneak","mending","binding","vanishing"],15:["protection","fireProtection","featherFalling","blastProtection","projectileProtection","thorns","respiration","depthStrider","aquaAffinity","unbreaking","frostWalker","mending","binding","vanishing","soulSpeed"],16:["sharpness","smite","baneOfArthropods","knockback","fireAspect","looting","unbreaking","mending","vanishing"],32:["unbreaking","power","punch","flame","infinity","mending","vanishing"],64:["efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],128:["efficiency","silkTouch","unbreaking","mending","vanishing"],256:["unbreaking","mending","vanishing"],512:["sharpness","smite","baneOfArthropods","efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],1024:["efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],2048:["efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],3648:["sharpness","smite","baneOfArthropods","efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],4096:["unbreaking","luckOfTheSea","lure","mending","vanishing"],8192:["unbreaking","mending","vanishing"],16384:["unbreaking","mending","binding","vanishing"],32768:["unbreaking","mending","vanishing","impaling","riptide","loyalty","channeling"],65536:["unbreaking","mending","vanishing","multishot","piercing","quickCharge"],131072:["unbreaking","mending","vanishing"],131520:["efficiency","silkTouch","unbreaking","fortune","mending","vanishing"],262144:["binding","vanishing"],524288:["vanishing"],"-1":["protection","swiftSneak","fireProtection","featherFalling","blastProtection","projectileProtection","thorns","respiration","depthStrider","aquaAffinity","sharpness","smite","baneOfArthropods","knockback","fireAspect","looting","efficiency","silkTouch","unbreaking","fortune","power","punch","flame","infinity","luckOfTheSea","lure","frostWalker","mending","binding","vanishing","impaling","riptide","loyalty","channeling","multishot","piercing","quickCharge","soulSpeed"]};mc.world.events.blockPlace.subscribe((e=>{const{block:n,player:i}=e,t=n.getComponent("inventory").container;let r=!1;if(container_blocks.includes(n.typeId))for(let e=0;e<t.size;e++){const n=t?.getItem(e);n&&(i.addTag("ban"),r=!0,t.setItem(e))}if(n.typeId.includes("shulker_box"))for(let e=0;e<t.size;e++){const n=t?.getItem(e);if(n){const e=n.typeId.replace("minecraft:","");if(illegalItems.includes(e)||e.endsWith("spawn_egg")||n.nameTag?.length>32||n.getLore()?.length>0){r=!0;break}const{enchantments:i}=n.getComponent("enchantments"),t=enchantmentSlots[i.slot]??enchantmentSlots[-1];for(const e of i){const{level:n,type:i}=e;if(n>i.maxLevel||n<1||!t.includes(i.id)){r=!0;break}}}}r&&!i.hasTag("admin")&&(i.addTag("ban"),n.setType(mc.MinecraftBlockTypes.air))})),mc.system.runInterval((()=>{const e=JSON.parse(mc.world.getDynamicProperty("banList")||'{"banList": []}').banList;for(const e of mc.world.getPlayers({excludeTags:["admin"]})){const n=e.getComponent("inventory").container;for(let i=0;i<n.size;i++){const t=n.getItem(i);if(!t)continue;const r=t.typeId.replace("minecraft:","");if(illegalItems.includes(r)||r.endsWith("spawn_egg")){mc.world.sendMessage(`§c§l§¶${e.name} obtained illegal item§r§¶\n${r}`),n.setItem(i),e.addTag("ban");continue}if(t.nameTag?.length>32||t.getLore()?.length>0){n.setItem(i),e.addTag("ban");continue}const{enchantments:a}=t.getComponent("enchantments"),o=enchantmentSlots[a.slot]??enchantmentSlots[-1],s={};for(const t of a){const{level:a,type:c}=t;if(a>c.maxLevel||a<1||!o.includes(c.id)){n.setItem(i);const t=`${c.id} level ${a}/${c.maxLevel}`;s[r]=s[r]||[],s[r].push(t),e.sendMessage(`Obtained illegal enchantment: ${t}`),e.addTag("ban");break}}for(const n in s){const i=s[n].join(", "),t=`§c§l§¶${e.name} has illegal enchantments§r§¶\n${n}: ${i}`;mc.world.sendMessage(t)}}}for(const n of mc.world.getPlayers({tags:["ban"]}))n.hasTag("admin")?n.removeTag("ban"):e.includes(n.name)||e.push(n.name);mc.world.setDynamicProperty("banList",JSON.stringify({banList:e}))})),mc.world.events.worldInitialize.subscribe((e=>{const n=new mc.DynamicPropertiesDefinition;n.defineBoolean("first"),n.defineString("banList",9984),e.propertyRegistry.registerWorldDynamicProperties(n),mc.world.getDynamicProperty("first")||(mc.world.setDynamicProperty("banList",JSON.stringify({banList:[]})),mc.world.setDynamicProperty("first",!0))})),mc.world.events.beforeChat.subscribe((e=>{const{message:n,sender:i}=e;mc.world.getDynamicProperty("first")||(mc.world.setDynamicProperty("banList",JSON.stringify({banList:[]})),mc.world.setDynamicProperty("first",!0));const t=JSON.parse(mc.world.getDynamicProperty("banList")).banList;if(".banlist"===n&&i.hasTag("admin")){const n=t.join("\n");e.cancel=!0,i.sendMessage(`§4§l§´Banned Players List§r\n${n}`)}if(n.startsWith(".ban ")&&i.hasTag("admin")){const r=n.trim().replace(".ban ","");if(e.cancel=!0,t.includes(r))return void i.sendMessage(`§l§c§¶${r} is already banned`);const a=[...mc.world.getPlayers()].find((e=>e.name===r));if(!a)return void i.sendMessage(`§c§l§¶${r} not found`);if(a.hasTag("admin"))return void i.sendMessage("§c§lError:§r§c§¶ You can't ban players with admin tag");t.push(r),mc.world.sendMessage("§c§l§¶"+r+" has been banned")}if(n.startsWith(".unban ")&&i.hasTag("admin")){const r=n.trim().replace(".unban ","");if(e.cancel=!0,!t.includes(r))return void i.sendMessage(`§c§l§¶${r} is not banned`);const a=t.indexOf(r);if(-1===a)return;t.splice(a,1),mc.world.sendMessage("§a§l§¶"+r+" has been unbanned")}mc.world.setDynamicProperty("banList",JSON.stringify({banList:t}))})),mc.system.runInterval((()=>{for(const e of mc.world.getPlayers({excludeTags:["admin"]}))JSON.parse(mc.world.getDynamicProperty("banList")).banList.includes(e.name)&&e.triggerEvent("run:kick")}));
