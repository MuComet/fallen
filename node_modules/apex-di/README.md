Apex: Dependency Injection Component
====================================

This package adds the inversion of control (IoC) code pattern to your (node) project.

## Installation

Using yarn
```bash
$ yarn add apex-di
```

or npm
```bash
$ npm install apex-di --save
```

### Getting started

Start by creating the container. A YAML file loader is available to load container configuration.
```javascript
const DI        = require('apex-di'),
      container = new DI.Container(),
      loader    = new DI.YamlLoader();

// Load parameters.yml into the service container.
container.load(loader, __dirname + '/config/parameters.yml');
```

```yaml
# config/parameters.yml
parameters:
    foobar: "Hello World!"
    title: "This is %foobar%!"
```

Now that we have `parameters.yml` loaded into the container, we can fetch these parameters like so:
```javascript
let foobar = container.getParameter('foobar'); // Hello World!
let title  = container.getParameter('title'); // This is Hello World!!
```

#### Working with services

A service is basically an instantiated javascript function (or class) that is reused throughout the lifetime of the
application. The idea of a service is that it is initialized once and reused later.

Lets say we have a class called `MathService` that we want to have injected somwhere.
```javascript
class MathService
{
    add (a, b)
    {
        return a + b;
    }
}

module.exports = MathService;
```

Without the use of dependency injection, you would just do something like this:
```javascript
const MathService = require('./MathService');

class MyService
{
    constructor ()
    {
        this.math_service = new MathService();
    }
}

module.exports = MyService;
```

However, if you want to unit-test `MyService`, there is no easy way to mock away the instance of math_service without
extending `MyService` and overriding the constructor or the `math_service` property during instantiation.

Dependency injection solves this for you.

If we have the following yaml file:
```yaml
services:
    my_service:
        class: !require "./MyService"
        arguments:
            - "@math_service"

    math_service:
        class: !require "./MathService"
```

A service is referenced using the `@`-prefix in your yaml file.

`MyService` now looks like this:
 ```javascript
class MyService
{
    constructor (math_service)
    {
        this.math_service = math_service;
    }
    
    add (a, b)
    {
        return this.math_service.add(a, b);
    }
}

module.exports = MyService;
```

The dependency on `MathService` is no longer there and can be interchanged with anything else, as long as it complies to
the same signatures as the original service.

Simply fetch the service from the container using the `get()` function:
```javascript
let my_service = container.get('my_service');
my_service.add(2, 3); // 5
```

Once the first service is fetched from the container, the container is compiled. It will resolve references to other
services and initialize them when needed. This effectively means that everything is _lazy loaded_.

## Features

### Importing other YAML files
You can import other yaml files from the current one, using the following syntax:
```yaml
imports:
    - "relative/to/current.yml"
    - "relative/another.yml"
```
The path is always relative to the currently parsed yaml file.

## Compiler passes
Compiler passes allow for modifications to the container during compilation.
A compiler pass is effectively a function (or class) that will be instaniated that has a `compile` method that accepts
the container as its first and only argument.

A typical pass would look like this:
```javascript
const Reference = require('apex-di').Reference;

module.exports = class MyCompilerPass
{
    compile (container)
    {
        let my_definition   = container.getDefinition('my_service_definition');
        let tagged_services = container.findTaggedServiceIds('some_tag'),
            references      = [];
        
        tagged_services.forEach((id) => {
            references.push(new Reference(id));
        });
        
        my_definition.replaceArgument(0, references);
    }
}
``` 

Add the compiler pass either in javascript or a yaml file.
```javascript
container.addCompilerPass(new MyCompilerPass());
```

```yaml
# container.yml
passes:
    - !require "./MyCompilerPass"
```

The example `CompilerPass` as it is given above can be simplified drastically by using the `!tagged` YAML type as
described below. 

### Auto injecting tagged services
You can auto-inject tagged services into another service definition.

```yaml
services:
    my_service_collector:
        class: !require "./my_module"
        arguments:
            - !tagged "my.tag"
            
    some_service_1:
        class: !require "./services/some_service_1"
        tags:  ["my.tag"]

    some_service_2:
        class: !require "./services/some_service_2"
        tags:  ["my.tag"]
```

In the example above, `my_service_collector` will have both `some_service_1` and `some_service_2` injected as an array
in its first argument.

This is the equivalent of;
```yaml
services:
    my_service_collector:
        class: !require "./my_module"
        arguments:
            - ["@some_service_1", "@some_service_2"]
``` 
... but injected services are not "hard-coded".

The advantage of this is pluggability. If a container is shared across an application and configuration from specific
node modules is loaded into the same container, this can enable 'third-party' instances to be injected into services,
which is effectively a basic form of "plugin management".

### Require a specific class from a module

You can require a specific class from a node module using the following `require` syntax inside a yaml file:
```yaml
services:
    my_service:
        class: !require ["./MyFrameworkThing", "MyService"]
```

This is useful for node modules that export multiple functions that could effectively be used as services, for example
something like this:

```javascript
module.exports = {
    MyService: require('./MyService') // exports a function that can be instantiated.
}
```

## Don't want to use YAML configuration?

Well, then you're out of lu... just kidding.

You can build the entire cntainer manually by using the `Definition` and `Reference` classes.
Look at the source of each of those files to see which public methods are available to work with. It's not all that
complicated.

```javascript
const DI        = require('apex-di'),
      container = new DI.Container();

// Add a definition.
container.setDefinition('my_service', new Definition(require('./MyService'), ['arg1', 2, {arg: 3}]));

// Compile (and freeze) the container.
container.compile();

// Fetch a service.
container.get('my_service'); // Instance of whatever is exported from ./MyService.js
```

Referencing other services is as easy as the following:
```javascript
let my_service_definition = new Definition(require('./MyService')),
    another_definition    = new Definition(require('./AnotherService'));

container.setDefinition('my_service', my_service_definition);
container.setDefinition('another_service', another_definition);

my_service_definition.setArguments([ new Reference('another_service') ]);
```

