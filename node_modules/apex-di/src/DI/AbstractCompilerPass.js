/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

class AbstractCompilerPass
{
    compile (container)
    {
        throw new Error('CompilerPass "' + this.constructor.name + '" did not implement a compile() method.');
    }
}

module.exports = AbstractCompilerPass;
