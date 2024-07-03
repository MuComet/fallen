/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const AbstractLoader       = require('./AbstractLoader'),
      AbstractCompilerPass = require('./AbstractCompilerPass'),
      Definition           = require('./Definition');

class Container
{
    constructor ()
    {
        Object.defineProperty(this, '$', {enumerable: false, value: {}});

        this.$.definitions     = {};
        this.$.services        = {};
        this.$.parameters      = {};
        this.$.compiler_passes = [];
        this.$.load_stack      = [];
        this.$.is_compiled     = false;
        this.$.is_compiling    = false;

        this.$.compileParameter = (name, parameter) => {
            if (typeof parameter === 'object') {
                Object.keys(parameter).forEach((name) => {
                    this.$.compileParameter(name, parameter[name]);
                });
                return;
            }

            if (typeof parameter === 'string') {
                let match, regexp = /%([A-Za-z0-9\._-]+)%/gi;
                while (match = regexp.exec(parameter)) {
                    if (typeof this.$.parameters[match[1]] === 'undefined') {
                        throw new Error('Parameter "' + name + '" references a non-existing parameter "' + match[1] + '".');
                    }
                    this.$.compileParameter(name, this.getParameter(match[1]));
                    this.$.parameters[name] = parameter.replace(match[0], this.$.parameters[match[1]]);
                }
            }

            return this.$.parameters[name];
        };
    }

    /**
     * Loads the specified file using the given loader.
     * The loader must be a derivative of AbstractLoader.
     *
     * It is the responsibility of the loader to resolve functions/classes that make up the services.
     * The resolved function or object is the first argument of the Definition that the loader must build.
     *
     * @param {AbstractLoader} loader
     * @param {String} file
     */
    load (loader, file)
    {
        if (!(loader instanceof AbstractLoader)) {
            throw new Error('The given loader must be an instance of AbstractLoader.');
        }

        loader.load(this, file);
    }

    /**
     * Adds a compiler pass to the container.
     * This instance must be a child class of AbstractCompilerPass that implements a method with the signature:
     *  - compile({Container] container)
     *
     * The compiler pass is free to modify any parameters or definitions, but is not allowed to retrieve instantiated
     * services from the container.
     *
     * @param {AbstractCompilerPass} compiler_pass
     */
    addCompilerPass (compiler_pass)
    {
        if (typeof compiler_pass === 'function') {
            compiler_pass = new compiler_pass();
        }

        if (typeof compiler_pass.compile !== 'function') {
            throw new Error('Argument #1 of addCompilerPass expeted to be a valid CompilerPass with a compile() method.');
        }

        this.$.compiler_passes.push(compiler_pass);
    }

    /**
     * Returns all ID's of services that are tagged with the given name.
     *
     * @param   {String} name
     * @returns {String[]}
     */
    findTaggedServiceIds (name)
    {
        let service_ids = [];
        Object.keys(this.$.definitions).forEach((id) => {
            if (this.$.definitions[id].hasTag(name)) {
                service_ids.push(id);
            }
        });

        return service_ids;
    }

    /**
     * Compiles the container by executing compiler passes of registered extensions.
     */
    compile ()
    {
        this.$.is_compiling = true;

        // Compiler passes
        this.$.compiler_passes.forEach((compiler_pass) => {
            compiler_pass.compile(this);
        });

        // Resolve parameters
        Object.keys(this.$.parameters).forEach((name) => {
            this.$.compileParameter(this.$.parameters[name]);
        });

        // Remove builder methods.
        this.hasDefinition  = undefined;
        this.getDefinition  = undefined;
        this.setDefinition  = undefined;
        this.load           = undefined;
        this.$.is_compiled  = true;
        this.$.is_compiling = false;
    }

    /**
     * Returns true if a parameter exists by the given name.
     *
     * @param   {String} name
     * @returns {Boolean}
     */
    hasParameter (name)
    {
        return typeof this.$.parameters[name] !== 'undefined';
    }

    /**
     * Returns the data of the parameter by the given name.
     *
     * @param   {String} name
     * @returns {*}
     */
    getParameter (name)
    {
        if (!this.hasParameter(name)) {
            throw new Error('Requested parameter "' + name + '" does not exist.');
        }

        return this.$.compileParameter(name, this.$.parameters[name]);
    }

    /**
     * Creates or updates a parameter with the given name and value.
     *
     * @param {String} name
     * @param {*}      value
     */
    setParameter (name, value)
    {
        this.$.parameters[name] = value;
    }


    /**
     * Sets the definition by the given id.
     *
     * @builder
     * @param {String} id
     * @param {Definition} definition
     */
    setDefinition (id, definition)
    {
        if (!(definition instanceof Definition)) {
            throw new Error('setDefinition requires argument #2 to be an instance of Definition.');
        }

        this.$.definitions[id] = definition;
    }

    /**
     * Returns true if a definition by the given id exists.
     *
     * @builder
     * @param {String} id
     */
    hasDefinition (id)
    {
        return typeof this.$.definitions[id] !== 'undefined';
    }

    /**
     * Returns a definition by the given name.
     *
     * @builder
     * @param   {String} id
     * @returns {*}
     */
    getDefinition (id)
    {
        if (!this.hasDefinition(id)) {
            throw new Error('The requested definition "' + id + '" does not exist.');
        }

        return this.$.definitions[id];
    }

    /**
     * Returns true if a service with the given id exists in this container.
     *
     * @param   {String} id
     * @returns {Boolean}
     */
    has (id)
    {
        return typeof this.$.definitions[id] !== 'undefined';
    }

    /**
     * Returns a service by the given id.
     *
     * @param   {String} id
     * @returns {*}
     */
    get (id)
    {
        if (typeof this.$.services[id] !== 'undefined') {
            return this.$.services[id];
        }

        // Compile the container if it wasn't already.
        if (!this.$.is_compiled) {
            if (this.$.is_compiling) {
                throw new Error('You cannot retrieve a service from the container while it is compiling.');
            }
            this.compile();
        }

        // Make sure the requested definition exists.
        if (typeof this.$.definitions[id] === 'undefined') {
            throw new Error('The requested service "' + id + '" does not exist.');
        }

        // Check for circular references.
        if (this.$.load_stack.indexOf(id) !== -1) {
            throw new Error('Circular reference detected while initializing service "' + id + '". Call stack: ' + this.$.load_stack.join(' -> '));
        }

        // Compose the final service.
        this.$.load_stack.push(id);
        this.$.services[id] = this.$.definitions[id].compose(this);
        this.$.load_stack.pop();

        return this.$.services[id];
    }
}

module.exports = Container;
