/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const DI = require('../../src/index');

/**
 * This example shows injection of {process.argv} into service dynamically when a service is tagged with
 * either 'argv.constructor' or 'argv.setter'.
 */
class ArgvCompilerPass extends DI.AbstractCompilerPass
{
    compile (container)
    {
        // Get the command line arguments.
        let argv = process.argv;

        // Find all services that are tagged with "argv.constructor".
        // These services will have argv injected as its first argument.
        let service_ids = container.findTaggedServiceIds('argv.constructor');
        service_ids.forEach((id) => {
            container.getDefinition(id).replaceArgument(0, argv);
        });

        // Find all services that are tagged with "argv.setter".
        service_ids = container.findTaggedServiceIds('argv.setter');

        // These services contain a method "setCommandLineArguments" that will have process.argv injected into it.
        service_ids.forEach((id) => {
            container.getDefinition(id).addMethodCall('setCommandLineArguments', [argv]);
        });
    }
}

module.exports = ArgvCompilerPass;
