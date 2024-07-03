class AutoTagCollector
{
    /**
     * This service is using the YAML type "!tagged" to automatically have service references injected that have the
     * defined tag. See services.yaml.
     *
     * @param {Array} auto_injected_tagged_services
     */
    constructor (auto_injected_tagged_services)
    {
        this.tagged_services = auto_injected_tagged_services;
    }
}

module.exports = AutoTagCollector;
