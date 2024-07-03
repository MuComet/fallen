/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const DI = require('../../src/index');

/**
 * This example demonstrates an example where a single command line argument is injected by replacing an argument
 * of a tagged service, while that service has a default defined in its service definition.
 */
class SingleArgvCompilerPass extends DI.AbstractCompilerPass
{
    compile (container)
    {
        // Get the command line arguments.
        let argv = process.argv;

        // Find all services that are tagged with "argv.single" and replace the second constructor argument with the
        // value in argv[1].
        let service_ids = container.findTaggedServiceIds('argv.single');
        service_ids.forEach((id) => {
            container.getDefinition(id).replaceArgument(1, argv[1]);
        });
    }
}

module.exports = SingleArgvCompilerPass;
