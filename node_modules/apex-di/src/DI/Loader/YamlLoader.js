/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const fs              = require('fs'),
      path            = require('path'),
      YAML            = require('js-yaml'),
      AbstractLoader  = require('../AbstractLoader'),
      Definition      = require('../Definition'),
      Reference       = require('../Reference'),
      TaggedReference = require('../TaggedReference');

/**
 * Loads YAML files into the service container.
 */
class YamlLoader extends AbstractLoader
{
    constructor ()
    {
        super();

        this._schema      = YAML.Schema.create(this._createSchema());
        this._lookup_dirs = [];
    }

    /**
     * Loads the given YAML file into the container.
     *
     * @param container
     * @param file
     */
    load (container, file)
    {
        let path_info = path.parse(file);
        let directory = path.resolve(path_info.dir);

        // Add the directory of the given file to the module paths lookup list. This way, relative imports of node-
        // modules are possible from the location of the YAML file.
        module.paths.unshift(directory);

        // Set container as class member in order for the custom YAML types to access it.
        this.container = container;

        // Load the YAML data as an object.
        let data = YAML.load(fs.readFileSync(file), {schema: this._schema});

        // Remove the container reference from the loader.
        this.container = undefined;

        // Remove the module path from the list after we're done reading.
        if (module.paths.shift() !== directory) {
            throw new Error('Integrity of module lookup paths has been compromised while loading YAML "' + file + '".');
        }

        // Process the data.
        this._parse(container, path_info, data);
    }

    loadRaw (file)
    {
        console.log('loadRaw');

        let path_info = path.parse(file),
            directory = path.resolve(path_info.dir);

        // Add the directory of the given file to the module paths lookup list. This way, relative imports of node-
        // modules are possible from the location of the YAML file.
        module.paths.unshift(directory);

        this._is_bare = true;
        let data = YAML.load(fs.readFileSync(file), {schema: this._schema});
        this._is_bare = false;

        return data;
    }

    /**
     * Parses the given data.
     *
     * @private
     * @param {Container} container
     * @param {Object}    path_info
     * @param {Object}    data
     */
    _parse (container, path_info, data)
    {
        if (typeof data !== 'object') {
            throw new Error('Unable to parse file: "' + path_info.base + '".');
        }

        if (typeof data.parameters === 'object') {
            this._parseParameters(container, data.parameters);
        }
        if (typeof data.services === 'object') {
            this._parseServices(container, data.services);
        }
        if (typeof data.imports === 'object') {
            this._parseImports(container, path_info, data.imports);
        }
        if (typeof data.passes === 'object') {
            this._parseCompilerPasses(container, data.passes);
        }
    }

    /**
     * @private
     * @param {Container} container
     * @param {Object}    parameters
     */
    _parseParameters (container, parameters)
    {
        Object.keys(parameters).forEach((name) => {
            container.setParameter(name, parameters[name]);
        });
    }

    /**
     * @private
     * @param {Container} container
     * @param {Object}    services
     */
    _parseServices (container, services)
    {
        let definition;
        Object.keys((services || {})).forEach((id) => {
            // Allow loading modules as services (static objects).
            if (typeof services[id]['module'] !== 'undefined') {
                services[id]['class'] = function () { return services[id]['module']; };
            }

            // Create the definition.
            definition = new Definition(services[id]['class'], this._parseArguments(services[id]['arguments'] || []));

            // Add method calls.
            (services[id].calls || []).forEach((call) => {
                definition.addMethodCall(call[0], this._parseArguments(call[1] || []));
            });

            // Add tags
            (services[id].tags || []).forEach((tag) => {
                definition.addTag(tag);
            });

            // Add properties.
            Object.keys((services[id].properties || {})).forEach((name) => {
                definition.setProperty(name, services[id][name]);
            });

            container.setDefinition(id, definition);
        });
    }

    /**
     * @private
     * @param {Container} container
     * @param {Object}    path_info
     * @param {Object}    imports
     */
    _parseImports (container, path_info, imports)
    {
        imports.forEach((file) => {
            file = path.join(path_info.dir, file);
            this.load(container, file);
        });
    }

    /**
     * @private
     * @param args_list
     */
    _parseArguments (args_list)
    {
        Object.keys(args_list).forEach((key) => {
            let ref_match = (new RegExp(/^@([a-zA-Z0-9\._]+)$/)).exec(args_list[key]);
            if (ref_match !== null && ref_match.length > 1) {
                args_list[key] = new Reference(ref_match[1]);
            }
        });

        return args_list;
    }

    _parseCompilerPasses (container, passes)
    {
        passes.forEach((pass) => { container.addCompilerPass(pass); });
    }

    /**
     * @private
     * @returns {Array}
     */
    _createSchema ()
    {
        return [
            new YAML.Type('!require', {
                kind:      'scalar',
                construct: (data) => {
                    if (this._is_bare) return '';

                    try {
                        return require(data);
                    } catch (e) {
                        let file = path.join(module.paths[0], data);
                        if (! fs.existsSync(file)) {
                            file += '.js';
                            if (! fs.existsSync(file)) {
                                throw new Error('Cannot find module "' + data + '".');
                            }
                        }
                        return require(file);
                    }
                }
            }),
            new YAML.Type('!require', {
                kind:      'sequence',
                construct: (data) => {
                    if (this._is_bare) return '';
                    let required_module;
                    try {
                        required_module = require(data[0]);
                    } catch (e) {
                        let file = path.join(module.paths[0], data[0]);
                        if (! fs.existsSync(file)) {
                            file += '.js';
                            if (! fs.existsSync(file)) {
                                throw new Error('Cannot find module "' + data[0] + '".');
                            }
                        }
                        required_module = require(file);
                    }

                    if (typeof required_module[data[1]] !== 'function') {
                        throw new Error('Expected "' + data[1] + '" from "' + data[0] + '" to be a constructor, got ' + (typeof (required_module[data[1]])) + ' instead.');
                    }

                    return required_module[data[1]];
                }
            }),
            new YAML.Type('!tagged', {
                kind: 'scalar',
                construct: (data) => {
                    if (this._is_bare) return '';
                    return new TaggedReference(data)
                }
            })
        ];
    }
}

module.exports = YamlLoader;
