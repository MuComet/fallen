/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

/* abstract */ class AbstractLoader
{
    load (container, file)
    {
        throw new Error('Loader "' + this.constructor.name + '" must implement a load() method.');
    }
}

module.exports = AbstractLoader;
