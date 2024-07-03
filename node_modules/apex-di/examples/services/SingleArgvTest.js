class SingleArgvTest
{
    /**
     * If the service is tagged with "argv.single", the SingleArgvCompilerPass will make sure to inject
     * {process.argv[1]} into the second argument of this constructor.
     *
     * @param {Array} args
     */
    constructor (a_dependency, argv_thing, title)
    {
        this.a_dependency = a_dependency;
        this.argv_thing   = argv_thing;
        this.title        = title;
    }
}

module.exports = SingleArgvTest;
