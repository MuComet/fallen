//=============================================================================
// main.js
//=============================================================================

PluginManager.setup($plugins);

window.onload = function() {
    SceneManager.run(Scene_Boot);
	//__initialize(); // Initialize engine (Scene_Engine.js). Called here so RPG maker can display a loading screen. (MOVED TO SCENE_ENGINE)
	// hide the cursor...
	//document.getElementById('ErrorPrinter').style.cursor = 'none'
	//document.getElementById('UpperCanvas').style.cursor = 'none'
};