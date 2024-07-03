/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const header = (str) => {
    console.log('');
    console.log('='.repeat(39 - (str.length / 2)) + ' ' + str + ' ' + '='.repeat(39 - (str.length / 2)));
    console.log('');
};

const DI        = require('../src/index'),
      container = new DI.Container(),
      loader    = new DI.YamlLoader();

container.load(loader, __dirname + '/config/container.yml');

header('ArgvCompilerPass example');
console.log('Injected through constructor: ', container.get('my_argv_aware_service').constructor_args);
console.log('Injected through setter: ', container.get('my_argv_aware_service').setter_args);

header('SingleArgvText example');
console.log('Dependency: ', container.get('single_argv_service').a_dependency);
console.log('Argv[1]: ', container.get('single_argv_service').argv_thing);
console.log('Title (param): ', container.get('single_argv_service').title);

header('AutoTaggedServices using !tagged YAML type');
console.log(container.get('auto_tag_collector').tagged_services);

header('Complex Constructor');
console.log(container.get('weird_arg_object').auto_tagged_object.auto_tagged);
