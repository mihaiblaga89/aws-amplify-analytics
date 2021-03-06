"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
var core_1 = require("@aws-amplify/core");
var auth_1 = require("@aws-amplify/auth");
var MobileAnalytics = require("aws-sdk/clients/mobileanalytics");
var Pinpoint = require("aws-sdk/clients/pinpoint");
var cache_1 = require("@aws-amplify/cache");
var uuid_1 = require("uuid");
var logger = new core_1.ConsoleLogger('AWSPinpointProvider');
var NON_RETRYABLE_EXCEPTIONS = ['BadRequestException', 'SerializationException', 'ValidationException'];
// events buffer
var BUFFER_SIZE = 1000;
var FLUSH_SIZE = 100;
var FLUSH_INTERVAL = 5 * 1000; // 5s
var RESEND_LIMIT = 5;
// params: { event: {name: , .... }, timeStamp, config, resendLimits }
var AWSPinpointProvider = /** @class */ (function () {
    function AWSPinpointProvider(config) {
        this._buffer = [];
        this._config = config ? config : {};
        this._config.bufferSize = this._config.bufferSize || BUFFER_SIZE;
        this._config.flushSize = this._config.flushSize || FLUSH_SIZE;
        this._config.flushInterval = this._config.flushInterval || FLUSH_INTERVAL;
        this._config.resendLimit = this._config.resendLimit || RESEND_LIMIT;
        this._clientInfo = core_1.ClientDevice.clientInfo();
        // flush event buffer
        this._setupTimer();
        logger.warn('Please ensure you have updated you Pinpoint IAM Policy' +
            'with the Action: "mobiletargeting:PutEvents" in order to' +
            'continue using AWS Pinpoint Service');
    }
    AWSPinpointProvider.prototype._setupTimer = function () {
        var _this = this;
        if (this._timer) {
            clearInterval(this._timer);
        }
        var _a = this._config, flushSize = _a.flushSize, flushInterval = _a.flushInterval;
        var that = this;
        this._timer = setInterval(function () {
            var size = _this._buffer.length < flushSize ? _this._buffer.length : flushSize;
            for (var i = 0; i < size; i += 1) {
                var params = _this._buffer.shift();
                that._sendFromBuffer(params);
            }
        }, flushInterval);
    };
    /**
     * @private
     * @param params - params for the event recording
     * Put events into buffer
     */
    AWSPinpointProvider.prototype._putToBuffer = function (params) {
        var bufferSize = this._config.bufferSize;
        if (this._buffer.length < bufferSize) {
            this._buffer.push(params);
            return Promise.resolve(true);
        }
        else {
            logger.debug('exceed analytics events buffer size');
            return Promise.reject(false);
        }
    };
    AWSPinpointProvider.prototype._sendFromBuffer = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var event, config, appId, region, resendLimit, cacheKey, _a, _b, success, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        event = params.event, config = params.config;
                        appId = config.appId, region = config.region, resendLimit = config.resendLimit;
                        cacheKey = this.getProviderName() + '_' + appId;
                        _a = config;
                        if (!config.endpointId) return [3 /*break*/, 1];
                        _b = config.endpointId;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this._getEndpointId(cacheKey)];
                    case 2:
                        _b = _d.sent();
                        _d.label = 3;
                    case 3:
                        _a.endpointId = _b;
                        success = true;
                        _c = event.name;
                        switch (_c) {
                            case '_session_start': return [3 /*break*/, 4];
                            case '_session_stop': return [3 /*break*/, 6];
                            case '_update_endpoint': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 4: return [4 /*yield*/, this._startSession(params)];
                    case 5:
                        success = _d.sent();
                        return [3 /*break*/, 12];
                    case 6: return [4 /*yield*/, this._stopSession(params)];
                    case 7:
                        success = _d.sent();
                        return [3 /*break*/, 12];
                    case 8: return [4 /*yield*/, this._updateEndpoint(params)];
                    case 9:
                        success = _d.sent();
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, this._recordCustomEvent(params)];
                    case 11:
                        success = _d.sent();
                        return [3 /*break*/, 12];
                    case 12:
                        if (!success) {
                            params.resendLimits = typeof params.resendLimits === 'number' ? params.resendLimits : resendLimit;
                            if (params.resendLimits > 0) {
                                logger.debug("resending event " + params.eventName + " with " + params.resendLimits + " retry times left");
                                params.resendLimits -= 1;
                                this._putToBuffer(params);
                            }
                            else {
                                logger.debug("retry times used up for event " + params.eventName);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * get the category of the plugin
     */
    AWSPinpointProvider.prototype.getCategory = function () {
        return AWSPinpointProvider.category;
    };
    /**
     * get provider name of the plugin
     */
    AWSPinpointProvider.prototype.getProviderName = function () {
        return AWSPinpointProvider.providerName;
    };
    /**
     * configure the plugin
     * @param {Object} config - configuration
     */
    AWSPinpointProvider.prototype.configure = function (config) {
        logger.debug('configure Analytics', config);
        var conf = config ? config : {};
        this._config = Object.assign({}, this._config, conf);
        this._setupTimer();
        return this._config;
    };
    /**
     * record an event
     * @param {Object} params - the params of an event
     */
    AWSPinpointProvider.prototype.record = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var credentials, timestamp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._getCredentials()];
                    case 1:
                        credentials = _a.sent();
                        if (!credentials || !this._config['appId'] || !this._config['region']) {
                            logger.debug('cannot send events without credentials, applicationId or region');
                            return [2 /*return*/, Promise.resolve(false)];
                        }
                        timestamp = new Date().getTime();
                        // attach the session and eventId
                        this._generateSession(params);
                        params.event.eventId = uuid_1.v1();
                        Object.assign(params, { timestamp: timestamp, config: this._config, credentials: credentials });
                        // temporary solution, will refactor in the future
                        if (params.event.immediate) {
                            return [2 /*return*/, this._send(params)];
                        }
                        else {
                            return [2 /*return*/, this._putToBuffer(params)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AWSPinpointProvider.prototype._generateSession = function (params) {
        this._sessionId = this._sessionId || uuid_1.v1();
        var event = params.event;
        switch (event.name) {
            case '_session_start':
                // refresh the session id and session start time
                this._sessionStartTimestamp = new Date().getTime();
                this._sessionId = uuid_1.v1();
                event.session = {
                    Id: this._sessionId,
                    StartTimestamp: new Date(this._sessionStartTimestamp).toISOString(),
                };
                break;
            case '_session_stop':
                var stopTimestamp = new Date().getTime();
                this._sessionStartTimestamp = this._sessionStartTimestamp || new Date().getTime();
                this._sessionId = this._sessionId || uuid_1.v1();
                event.session = {
                    Id: this._sessionId,
                    Duration: stopTimestamp - this._sessionStartTimestamp,
                    StartTimestamp: new Date(this._sessionStartTimestamp).toISOString(),
                    StopTimestamp: new Date(stopTimestamp).toISOString(),
                };
                this._sessionId = undefined;
                this._sessionStartTimestamp = undefined;
                break;
            default:
                this._sessionStartTimestamp = this._sessionStartTimestamp || new Date().getTime();
                this._sessionId = this._sessionId || uuid_1.v1();
                event.session = {
                    Id: this._sessionId,
                    StartTimestamp: new Date(this._sessionStartTimestamp).toISOString(),
                };
                break;
        }
    };
    AWSPinpointProvider.prototype._send = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var event, config, appId, region, cacheKey, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        event = params.event, config = params.config;
                        appId = config.appId, region = config.region;
                        cacheKey = this.getProviderName() + '_' + appId;
                        _a = config;
                        if (!config.endpointId) return [3 /*break*/, 1];
                        _b = config.endpointId;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this._getEndpointId(cacheKey)];
                    case 2:
                        _b = _c.sent();
                        _c.label = 3;
                    case 3:
                        _a.endpointId = _b;
                        switch (event.name) {
                            case '_session_start':
                                return [2 /*return*/, this._startSession(params)];
                            case '_session_stop':
                                return [2 /*return*/, this._stopSession(params)];
                            case '_update_endpoint':
                                return [2 /*return*/, this._updateEndpoint(params)];
                            default:
                                return [2 /*return*/, this._recordCustomEvent(params)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AWSPinpointProvider.prototype._generateBatchItemContext = function (params) {
        var event = params.event, timestamp = params.timestamp, config = params.config, credentials = params.credentials;
        var name = event.name, attributes = event.attributes, metrics = event.metrics, eventId = event.eventId, session = event.session;
        var appId = config.appId, endpointId = config.endpointId;
        var endpointContext = this._generateEndpointContext(config);
        var eventParams = {
            ApplicationId: appId,
            EventsRequest: {
                BatchItem: {},
            },
        };
        eventParams.EventsRequest.BatchItem[endpointId] = {};
        var endpointObj = eventParams.EventsRequest.BatchItem[endpointId];
        endpointObj['Endpoint'] = endpointContext;
        endpointObj['Events'] = {};
        endpointObj['Events'][eventId] = {
            EventType: name,
            Timestamp: new Date(timestamp).toISOString(),
            Attributes: attributes,
            Metrics: metrics,
            Session: session,
        };
        return eventParams;
    };
    AWSPinpointProvider.prototype._pinpointPutEvents = function (eventParams) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                logger.debug('pinpoint put events with params', eventParams);
                return [2 /*return*/, new Promise(function (res, rej) {
                        var request = _this.pinpointClient.putEvents(eventParams);
                        // in order to keep backward compatiblity
                        // we are using a legacy api: /apps/{appid}/events/legacy
                        // so that users don't need to update their IAM Policy
                        // will use the formal one in the next break release
                        request.on('build', function () {
                            request.httpRequest.path = request.httpRequest.path + '/legacy';
                        });
                        request.send(function (err, data) {
                            if (err) {
                                logger.debug('record event failed. ', err);
                                logger.error('Please ensure you have updated you Pinpoint IAM Policy' +
                                    'with the Action: "mobiletargeting:PutEvents" in order to' +
                                    'continue using AWS Pinpoint Service');
                                res(false);
                            }
                            else {
                                logger.debug('record event success. ', data);
                                res(true);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * @private
     * @param params
     */
    AWSPinpointProvider.prototype._startSession = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var event, timestamp, config, credentials, eventParams;
            return __generator(this, function (_a) {
                event = params.event, timestamp = params.timestamp, config = params.config, credentials = params.credentials;
                this._initClients(config, credentials);
                logger.debug('record session start');
                eventParams = this._generateBatchItemContext(params);
                return [2 /*return*/, this._pinpointPutEvents(eventParams)];
            });
        });
    };
    /**
     * @private
     * @param params
     */
    AWSPinpointProvider.prototype._stopSession = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var event, timestamp, config, credentials, eventParams;
            return __generator(this, function (_a) {
                event = params.event, timestamp = params.timestamp, config = params.config, credentials = params.credentials;
                this._initClients(config, credentials);
                logger.debug('record session stop');
                eventParams = this._generateBatchItemContext(params);
                return [2 /*return*/, this._pinpointPutEvents(eventParams)];
            });
        });
    };
    /**
     * @private
     * @param params
     */
    AWSPinpointProvider.prototype._recordCustomEvent = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var event, timestamp, config, credentials, eventParams;
            return __generator(this, function (_a) {
                event = params.event, timestamp = params.timestamp, config = params.config, credentials = params.credentials;
                this._initClients(config, credentials);
                logger.debug('record event with params');
                eventParams = this._generateBatchItemContext(params);
                return [2 /*return*/, this._pinpointPutEvents(eventParams)];
            });
        });
    };
    AWSPinpointProvider.prototype._updateEndpoint = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, config, credentials, event, appId, region, endpointId, request, update_params, that;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = params.timestamp, config = params.config, credentials = params.credentials, event = params.event;
                        appId = config.appId, region = config.region, endpointId = config.endpointId;
                        this._initClients(config, credentials);
                        return [4 /*yield*/, this._endpointRequest(config, event)];
                    case 1:
                        request = _a.sent();
                        update_params = {
                            ApplicationId: appId,
                            EndpointId: endpointId,
                            EndpointRequest: request,
                        };
                        that = this;
                        logger.debug('updateEndpoint with params: ', update_params);
                        return [2 /*return*/, new Promise(function (res, rej) {
                                that.pinpointClient.updateEndpoint(update_params, function (err, data) {
                                    if (err) {
                                        logger.debug('updateEndpoint failed', err);
                                        res(false);
                                    }
                                    else {
                                        logger.debug('updateEndpoint success', data);
                                        res(true);
                                    }
                                });
                            })];
                }
            });
        });
    };
    /**
     * @private
     * @param config
     * Init the clients
     */
    AWSPinpointProvider.prototype._initClients = function (config, credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var region;
            return __generator(this, function (_a) {
                logger.debug('init clients');
                if (this.mobileAnalytics &&
                    this.pinpointClient &&
                    this._config.credentials &&
                    this._config.credentials.sessionToken === credentials.sessionToken &&
                    this._config.credentials.identityId === credentials.identityId) {
                    logger.debug('no change for aws credentials, directly return from init');
                    return [2 /*return*/];
                }
                this._config.credentials = credentials;
                region = config.region;
                logger.debug('init clients with credentials', credentials);
                this.mobileAnalytics = new MobileAnalytics({ credentials: credentials, region: region });
                this.pinpointClient = new Pinpoint({ region: region, credentials: credentials });
                return [2 /*return*/];
            });
        });
    };
    AWSPinpointProvider.prototype._getEndpointId = function (cacheKey) {
        return __awaiter(this, void 0, void 0, function () {
            var endpointId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, cache_1.default.getItem(cacheKey)];
                    case 1:
                        endpointId = _a.sent();
                        logger.debug('endpointId from cache', endpointId, 'type', typeof endpointId);
                        if (!endpointId) {
                            endpointId = uuid_1.v1();
                            cache_1.default.setItem(cacheKey, endpointId);
                        }
                        return [2 /*return*/, endpointId];
                }
            });
        });
    };
    /**
     * EndPoint request
     * @return {Object} - The request of updating endpoint
     */
    AWSPinpointProvider.prototype._endpointRequest = function (config, event) {
        var credentials = config.credentials;
        var clientInfo = this._clientInfo;
        var Address = event.Address, RequestId = event.RequestId, Attributes = event.Attributes, UserAttributes = event.UserAttributes, UserId = event.UserId, OptOut = event.OptOut;
        var ChannelType = Address ? (clientInfo.platform === 'android' ? 'GCM' : 'APNS') : undefined;
        var ret = {
            Address: Address,
            Attributes: Attributes,
            ChannelType: ChannelType,
            Demographic: {
                AppVersion: event.appVersion || clientInfo.appVersion,
                Make: clientInfo.make,
                Model: clientInfo.model,
                ModelVersion: clientInfo.version,
                Platform: clientInfo.platform,
            },
            OptOut: OptOut,
            RequestId: RequestId,
            EffectiveDate: Address ? new Date().toISOString() : undefined,
            User: {
                UserId: UserId ? UserId : credentials.identityId,
                UserAttributes: UserAttributes,
            },
        };
        return auth_1.default.currentAuthenticatedUser()
            .then(function (user) {
            logger.debug('Got user for updateEndpoint', user);
            if (user.attributes && user.attributes.sub) {
                ret.User.UserId = user.attributes.sub;
            }
            else {
                ret.User.UserId = UserId ? UserId : credentials.identityId;
            }
            return ret;
        })
            .catch(function (err) {
            logger.debug('Error getting authenticated user, falling back to IdentityId', err);
            ret.User.UserId = UserId ? UserId : credentials.identityId;
            return ret;
        });
    };
    /**
     * @private
     * generate client context with endpoint Id and app Id provided
     */
    AWSPinpointProvider.prototype._generateEndpointContext = function (config) {
        var endpointId = config.endpointId, appId = config.appId;
        var clientContext = config.clientContext || {};
        var clientInfo = this._clientInfo;
        var endpointCtx = {
            Demographic: {
                Make: clientContext.make || clientInfo.make,
                Model: clientContext.model || clientInfo.model,
                Locale: clientContext.locale,
                AppVersion: clientContext.appVersionName,
                Platform: clientContext.platform || clientInfo.platform,
                PlatformVersion: clientContext.platformVersion || clientInfo.version,
            },
        };
        return endpointCtx;
    };
    /**
     * @private
     * check if current credentials exists
     */
    AWSPinpointProvider.prototype._getCredentials = function () {
        var that = this;
        return core_1.Credentials.get()
            .then(function (credentials) {
            if (!credentials)
                return null;
            logger.debug('set credentials for analytics', credentials);
            return core_1.Credentials.shear(credentials);
        })
            .catch(function (err) {
            logger.debug('ensure credentials error', err);
            return null;
        });
    };
    AWSPinpointProvider.category = 'Analytics';
    AWSPinpointProvider.providerName = 'AWSPinpoint';
    return AWSPinpointProvider;
}());
exports.default = AWSPinpointProvider;
//# sourceMappingURL=AWSPinpointProvider.js.map