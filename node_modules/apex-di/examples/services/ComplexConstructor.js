class ComplexConstructor
{
    /**
     * Has two objects injected that have auto tagged service injection and regular injections through the DI.
     *
     * @param {Object} auto_tagged_object
     */
    constructor (auto_tagged_object, other_object)
    {
        this.auto_tagged_object = auto_tagged_object;
        this.other_object       = other_object;
    }
}

module.exports = ComplexConstructor;
