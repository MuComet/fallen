class MyServiceArgvTest
{
    /**
     * If the service is tagged with "argv.constructor", the ArgvCompilerPass will make sure to inject {process.argv}
     * into the first argument of this constructor.
     *
     * @param {Array} args
     */
    constructor (args)
    {
        this.constructor_args = args;
    }

    /**
     * Sets command line arguments to process.
     * These are injected automatically by the compiler pass when this service is retrieved from the container.
     *
     * @param {Array} args
     */
    setCommandLineArguments (args)
    {
        this.setter_args = args;
    }
}

module.exports = MyServiceArgvTest;
