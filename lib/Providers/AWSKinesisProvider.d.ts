import { AnalyticsProvider } from '../types';
export default class AWSKinesisProvider implements AnalyticsProvider {
    private _config;
    private _kinesis;
    private _buffer;
    private _timer;
    constructor(config?: any);
    private _setupTimer;
    /**
     * get the category of the plugin
     */
    getCategory(): string;
    /**
     * get provider name of the plugin
     */
    getProviderName(): string;
    /**
     * configure the plugin
     * @param {Object} config - configuration
     */
    configure(config: any): object;
    /**
     * record an event
     * @param {Object} params - the params of an event
     */
    record(params: any): Promise<boolean>;
    updateEndpoint(params: any): Promise<boolean>;
    /**
     * @private
     * @param params - params for the event recording
     * Put events into buffer
     */
    private _putToBuffer;
    private _sendFromBuffer;
    private _sendEvents;
    private _init;
    /**
     * @private
     * check if current credentials exists
     */
    private _getCredentials;
}
