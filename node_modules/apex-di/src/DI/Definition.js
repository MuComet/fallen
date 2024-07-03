/* APEX; Dependency Injection Component            _______
 *                                                 ___    |________________  __
 * Copyright 2017, Harold Iedema                   __  /| |__  __ \  _ \_  |/_/
 * <harold@iedema.me>                              _  ___ |_  /_/ /  __/_>  <
 * Licensed under MIT.                             /_/  |_|  .___/\___//_/|_|
 * ----------------------------------------------------- /_*/
'use strict';

const Reference       = require('./Reference'),
      TaggedReference = require('./TaggedReference');

class Definition
{
    /**
     * @param {Function|Object} class_function
     * @param {Array}           argument_list
     */
    constructor (class_function, argument_list)
    {
        Object.defineProperty(this, '$', { enumerable: false, value: {} });

        this.$.class_function = class_function;
        this.$.argument_list  = argument_list;
        this.$.private        = false;
        this.$.initialized    = false;
        this.$.calls          = [];
        this.$.properties     = {};
        this.$.tags           = [];

        if (typeof class_function !== 'function') {
            throw new Error('Argument #1 of Definition expected to receive a Function, got ' + typeof class_function + ' instead.');
        }
    }

    /**
     * Adds a method to call when the service is initialized.
     *
     * @param {String} method
     * @param {Array}  argument_list
     */
    addMethodCall (method, argument_list)
    {
        this.$.calls.push([method, argument_list]);
    }

    /**
     * Adds a tag to this service.
     *
     * @param {String} name
     */
    addTag (name)
    {
        // Don't add the same tag twice.
        if (this.hasTag(name)) {
            return;
        }

        this.$.tags.push(name);
    }

    /**
     * Sets a property for this service.
     * When this service is initialized, the property will be injected into the constructed service.
     *
     * Beware that injection happens _after_ instantiation of the class, so properties are not available inside the
     * constructor of the service.
     *
     * @param name
     * @param value
     */
    setProperty (name, value)
    {
        this.$.properties[name] = value;
    }

    /**
     * Sets the arguments for this definition.
     *
     * @param {Array} args
     */
    setArguments (args)
    {
        if (! Array.isArray(args)) {
            throw new Error('Argument one of setArguments() must be of type Array. Got ' + (typeof args) + ' instead.');
        }

        this.$.argument_list = args;
    }

    /**
     * Replaces an argument.
     *
     * @param {Number} index
     * @param {*}      value
     */
    replaceArgument (index, value)
    {
        if (index > this.$.argument_list.length - 1) {
            throw new Error('Argument index #' + index + ' is out of range 0~' + (this.$.argument_list.length - 1) + '.');
        }
        this.$.argument_list[index] = value;
    }

    /**
     * Returns true if this service has a tag with the given name.
     *
     * @param   {String} name
     * @returns {Boolean}
     */
    hasTag (name)
    {
        return this.$.tags.indexOf(name) !== -1;
    }

    compose (container)
    {
        if (this.$.initialized) {
            throw new Error('Definition was already initialized.');
        }

        // Compile arguments.
        let _arguments = [];
        if (! Array.isArray(this.$.argument_list)) {
            throw new Error('The element "arguments" must be of type Array, got ' + (typeof this.$.argument_list) + '.');
        }
        this.$.argument_list.forEach((argument) => {
            _arguments.push(this._compileArgument(container, argument));
        });

        // Instantiator
        let Service = function (fn, args) {
            args.unshift(fn.prototype);
            return new (Function.prototype.bind.apply(fn, args));
        };

        // Instantiate service.
        let service = Service(this.$.class_function, _arguments);

        // Method calls.
        this.$.calls.forEach((call) => {
            let fn = call[0], args = [];
            (call[1] || []).forEach((arg) => {
                args.push(this._compileArgument(container, arg));
            });
            if (typeof service[fn] !== 'function') {
                throw new Error('The service does not have a method named "' + fn + '".');
            }
            service[fn].apply(service, args);
        });

        // Properties.
        Object.keys(this.$.properties).forEach((name) => {
            service[name] = this._compileArgument(container, this.$.properties[name]);
        });

        return service;
    }

    /**
     * Compiles the argument.
     *
     * @private
     * @param {Container} container
     * @param {*}         argument
     * @param {Number}    depth
     * @returns {*}
     */
    _compileArgument (container, argument, depth)
    {
        depth = depth || 0;
        depth += 1;

        if (depth > 10) {
            console.warn('Recursion detected. Aborting argument parsing');
            return argument;
        }

        if (typeof argument === 'string') {
            let match, regexp = /%([A-Za-z0-9\._-]+)%/gi;
            while (match = regexp.exec(argument)) {
                if (!container.hasParameter(match[1])) {
                    throw new Error('A references to a non-existing parameter "' + match[1] + '" was found.');
                }
                argument = argument.replace(match[0], container.getParameter(match[1]));
            }
            return argument;
        }

        if (argument instanceof Reference) {
            return container.get(argument.id);
        }

        if (argument instanceof TaggedReference) {
            let arg = [];
            container.findTaggedServiceIds(argument.tag).forEach((id) => {
                arg.push(container.get(id));
            });
            return arg;
        }

        if (typeof argument === 'object' && argument !== null) {
            Object.keys(argument).forEach((key) => {
                argument[key] = this._compileArgument(container, argument[key], depth);
            });
        }

        return argument;
    }
}

module.exports = Definition;
