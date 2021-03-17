// Generated by RPG Maker.
// Do not edit this file directly.
var $plugins =
[
{"name":"Community_Basic","status":true,"description":"Basic plugin for manipulating important parameters.","parameters":{"cacheLimit":"20","screenWidth":"816","screenHeight":"624","changeWindowWidthTo":"","changeWindowHeightTo":"","renderingMode":"auto","alwaysDash":"off"}},
{"name":"MadeWithMv","status":false,"description":"Show a Splash Screen \"Made with MV\" and/or a Custom Splash Screen before going to main screen.","parameters":{"Show Made With MV":"true","Made with MV Image":"logo","Show Custom Splash":"false","Custom Image":"","Fade Out Time":"60","Fade In Time":"60","Wait Time":"160"}},
{"name":"AltimitMovement","status":true,"description":"Vector-based character movement and collision","parameters":{"player":"","player_collider_list":"\"<circle cx='0.5' cy='0.7' r='0.25' />\"","player_circular_movement":"true","":"","followers":"","followers_distance":"1.50","followers_collider_list":"\"<circle cx='0.5' cy='0.7' r='0.25' />\"","followers_circular_movement":"true","vehicles":"","vehicles_boat_collider_list":"\"<circle cx='0.5' cy='0.5' r='0.333' />\"","vehicles_ship_collider_list":"\"<circle cx='0.5' cy='0.5' r='0.5' />\"","vehicles_airship_collider_list":"\"<circle cx='0.5' cy='0.5' r='0.25' />\"","event":"","event_character_collider_list":"\"<circle cx='0.5' cy='0.7' r='0.35' />\"","event_tile_collider_list":"\"<rect x='0' y='0' width='1' height='1' />\"","presets":"[]","move_route":"","move_route_align_grid":"true","input_config":"","input_config_enable_touch_mouse":"true","input_config_gamepad_mode":"3","play_test":"","play_test_collision_mesh_caching":"false"}},
{"name":"YEP_CoreEngine","status":true,"description":"v1.32 Needed for the majority of Yanfly Engine Scripts. Also\r\ncontains bug fixes found inherently in RPG Maker.","parameters":{"---Screen---":"","Screen Width":"816","Screen Height":"624","Scale Battlebacks":"true","Scale Title":"true","Scale Game Over":"true","Open Console":"false","Reposition Battlers":"true","GameFont Load Timer":"0","Update Real Scale":"false","Collection Clear":"true","---Gold---":"","Gold Max":"99999999","Gold Font Size":"20","Gold Icon":"313","Gold Overlap":"A lotta","---Items---":"","Default Max":"99","Quantity Text Size":"20","---Parameters---":"","Max Level":"99","Actor MaxHP":"9999","Actor MaxMP":"9999","Actor Parameter":"999","Enemy MaxHP":"999999","Enemy MaxMP":"9999","Enemy Parameter":"999","---Battle---":"","Animation Rate":"4","Flash Target":"false","Show Events Transition":"true","Show Events Snapshot":"true","---Map Optimization---":"","Refresh Update HP":"true","Refresh Update MP":"true","Refresh Update TP":"false","---Font---":"","Chinese Font":"SimHei, Heiti TC, sans-serif","Korean Font":"Dotum, AppleGothic, sans-serif","Default Font":"GameFont, Verdana, Arial, Courier New","Font Size":"28","Text Align":"left","---Windows---":"","Digit Grouping":"true","Line Height":"36","Icon Width":"32","Icon Height":"32","Face Width":"144","Face Height":"144","Window Padding":"18","Text Padding":"6","Window Opacity":"255","Gauge Outline":"true","Gauge Height":"18","Menu TP Bar":"true","---Window Colors---":"","Color: Normal":"0","Color: System":"16","Color: Crisis":"17","Color: Death":"18","Color: Gauge Back":"19","Color: HP Gauge 1":"20","Color: HP Gauge 2":"21","Color: MP Gauge 1":"22","Color: MP Gauge 2":"23","Color: MP Cost":"23","Color: Power Up":"24","Color: Power Down":"25","Color: TP Gauge 1":"28","Color: TP Gauge 2":"29","Color: TP Cost Color":"29"}},
{"name":"YEP_KeyboardConfig","status":true,"description":"v1.04 Allows players to adjust their button configuration\nfor keyboards.","parameters":{"---General---":"","Command Name":"Keyboard Config","Button Events":"1 2 3","Button Events List":"[]","---Help Text---":"","Key Help":"Change the configuration of this key?","Default Layout":"Default Keyboard Layout","Default Help":"Reverts your keyboard setting to the default setup.","WASD Layout":"WASD Movement Layout","WASD Help":"Changes your keyboard to WASD movement.","Finish Config":"Finish Configuration","Finish Help":"Are you done configuring your keyboard?","Assigned Color":"21","Action Color":"4","Clear Text":"Clear","---Key Names---":"","OK Key":"OK","OK Text":"OK / Talk","Escape Key":"X","Escape Text":"Cancel / Menu","Cancel Key":"Cancel","Cancel Text":"Cancel","Menu Key":"Menu","Menu Text":"Menu","Shift Key":"Dash","Shift Text":"Dash","PageUp Key":"PgUp","PageUp Text":"Page Up","PageDown Key":"PgDn","PageDown Text":"Page Down","Left Key":"◄","Left Text":"Move ◄ Left","Up Key":"▲","Up Text":"Move ▲ Up","Right Key":"►","Right Text":"Move ► Right","Down Key":"▼","Down Text":"Move ▼ Down"}},
{"name":"YEP_SkillCore","status":true,"description":"v1.13 Skills are now given more functions and the ability\r\nto require different types of costs.","parameters":{"---General---":"","Cost Padding":"4","Command Alignment":"center","Window Columns":"2","---HP Costs---":"","HP Format":"%1%2","HP Font Size":"20","HP Text Color":"18","HP Icon":"162","---MP Costs---":"","MP Format":"%1%2","MP Font Size":"20","MP Text Color":"23","MP Icon":"165","---TP Costs---":"","TP Format":"%1%2","TP Font Size":"20","TP Text Color":"29","TP Icon":"164"}},
{"name":"YEP_MessageCore","status":true,"description":"v1.19 Adds more features to the Message Window to customized\r\nthe way your messages appear and functions.","parameters":{"---General---":"","Default Rows":"4","Default Width":"Graphics.boxWidth","Face Indent":"Window_Base._faceWidth + 24","Fast Forward Key":"control","Enable Fast Forward":"true","Word Wrapping":"false","Description Wrap":"false","Word Wrap Space":"false","Tight Wrap":"false","---Font---":"","Font Name":"GameFont","Font Name CH":"SimHei, Heiti TC, sans-serif","Font Name KR":"Dotum, AppleGothic, sans-serif","Font Size":"28","Font Size Change":"12","Font Changed Max":"96","Font Changed Min":"12","Font Outline":"0","Maintain Font":"false","---Name Box---":"","Name Box Buffer X":"-28","Name Box Buffer Y":"0","Name Box Padding":"this.standardPadding() * 4","Name Box Color":"0","Name Box Clear":"false","Name Box Added Text":"","Name Box Auto Close":"false"}},
{"name":"QPlus","status":true,"description":"<QPlus> (Should go above all Q Plugins)\r\nSome small changes to MV for easier plugin development.","parameters":{"Quick Test":"true","Default Enabled Switches":"[]","Ignore Mouse when inactive":"false"}},
{"name":"QTouch","status":true,"description":"<QTouch>\r\nBetter mouse handling for MV","parameters":{"Mouse Decay":"60","Default Cursor":"","Pointer Cursor":""}},
{"name":"RS_GraphicsMenu","status":true,"description":"This plugin allows you to indicate the menu as an image <RS_GraphicsMenu>","parameters":{"Menu Image":"buttons_1-Sheet-export","Starting Position":"","Start X":"Graphics.boxWidth / 2 - ((W * RECT.length) / 2)","Start Y":"Graphics.boxHeight / 2 - H / 2","Rect":"","Menu Rect":"[\"{\\\"x\\\":\\\"0\\\",\\\"y\\\":\\\"[\\\\\\\"0\\\\\\\",\\\\\\\"100\\\\\\\"]\\\",\\\"width\\\":\\\"100\\\",\\\"height\\\":\\\"100\\\"}\",\"{\\\"x\\\":\\\"100\\\",\\\"y\\\":\\\"[\\\\\\\"0\\\\\\\",\\\\\\\"100\\\\\\\"]\\\",\\\"width\\\":\\\"100\\\",\\\"height\\\":\\\"100\\\"}\",\"{\\\"x\\\":\\\"200\\\",\\\"y\\\":\\\"[\\\\\\\"0\\\\\\\",\\\\\\\"100\\\\\\\"]\\\",\\\"width\\\":\\\"100\\\",\\\"height\\\":\\\"100\\\"}\",\"{\\\"x\\\":\\\"300\\\",\\\"y\\\":\\\"[\\\\\\\"0\\\\\\\",\\\\\\\"100\\\\\\\"]\\\",\\\"width\\\":\\\"100\\\",\\\"height\\\":\\\"100\\\"}\"]","W":"100","H":"100","Menu Index":"[\"Scene_Item\",\"Scene_Options\",\"Scene_Save\",\"Scene_GameEnd\"]"}},
{"name":"More Character Frames (MV)","status":true,"description":"Allows more than 3 Frames","parameters":{}},
{"name":"GALV_MessageSoundEffects","status":true,"description":"Play sound effects when during Show Text event commands.","parameters":{"Delay Time":"5","Default Talk SE":"","Default Confirm SE":"","-----------":"","Quick SE 1":"Voice,30,100","Quick SE 2":"Voice,30,50","Quick SE 3":"Voice,30,150","Quick SE 4":"VoiceSeye,30,100"}},
{"name":"SRD_SuperToolsEngine","status":true,"description":"The heart of all maker-style plugins; it adds a playtesting editor that can be opened with F12.","parameters":{"Connect Editor":"true","Auto Open Window":"false","Auto Move Window":"true","Menu Editor Exempt List":"[\"Window_BattleLog\",\"Window_MapName\"]"}},
{"name":"SRD_HUDMaker","status":true,"description":"Allows developers to create their own map-based HUD through an in-game GUI window!","parameters":{"Active Updating":"false","Show During Events":"hide","Map Global Condition":"","Battle Global Condition":"","Disable Delete Key":"true"}},
{"name":"ShazLargeSpriteFix","status":true,"description":"Fixes issue with large sprites appearing over ☆ passability tiles","parameters":{"Terrain Id":"1","Apply to Followers":"N","Apply to Vehicles":"Y","Apply to All Events":"Y"}},
{"name":"KhasCore","status":true,"description":"[2.0] Required by Khas plugins.","parameters":{}},
{"name":"KhasGraphics","status":true,"description":"[1.1] Required by Khas graphics plugins.","parameters":{}},
{"name":"KhasAdvancedFog","status":true,"description":"[3.0] Adds procedural fog to your game.","parameters":{"Variable Fog Density":"ON","Zoom Compatibility":"OFF","MBS Zoom":"OFF","Transfer Reset":"OFF","Auto Battle Fog":"ON"}},
{"name":"KhasUltraLighting","status":true,"description":"[4.2] Adds lighting and real-time shadows to your game.","parameters":{"Custom Blending":"ON","Transfer Reset":"ON","Auto Battle Lighting":"ON"}},
{"name":"MrTS_NoItemCategories","status":true,"description":"Removes item categories from item menu scene and from shop scene.","parameters":{"Hide Menu":"True","Hide Shop":"True"}},
{"name":"YEP_FootstepSounds","status":true,"description":"v1.01 Set footstep sounds to play when the player and/or\r\nevents walk over specific tiles.","parameters":{"---Default---":"","Default Sound":"Walk","Default Volume":"100","Default Pitch":"100","---Player Settings---":"","Player Enable":"true","Player Volume":"1.00","Player Pitch":"1.00","---Event Settings---":"","Event Enable":"true","Event Volume":"1.00","Distance Volume":"-0.10","Event Pitch":"1.00","Distance Pitch":"-0.00","Distance Pan":"10"}},
{"name":"CaeX_FootstepTime","status":true,"description":"v1.0 - Extends YEP_FootstepSounds: minimum time between step sounds.","parameters":{"Sound Interval":"20","Property Name":"_stepSoundTime"}}
];
