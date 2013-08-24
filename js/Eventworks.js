/*
 * Eventworks - A channeled pubsub system
 * https://github.com/zohogorganzola/Eventworks
 */

(function(Eventworks) {

    //Helpers
    var indexOf = function(array, item) {
            if (array == null) return -1;
            var i, l;
            if (Array.prototype.indexOf && array.indexOf === Array.prototype.indexOf) return array.indexOf(item);
            for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
            return -1;
        },
        //Create object polyfill
        createObject = Object.create || function(o) {
            function F() {}
            F.prototype = o;
            return new F();
        };

    function createChannelInterface(channel) {
        var channelInterface = createObject(null);

        channelInterface.publish = function() {
            channel.publish.apply(channel, arguments);
            return channelInterface;
        };
        channelInterface.subscribe = function() {
            channel.subscribe.apply(channel, arguments);
            return channelInterface;
        };

        channelInterface.unsubscribe = function() {
            channel.unsubscribe.apply(channel, arguments);
            return channelInterface;
        };

        return channelInterface;
    }

    function makeEventworks(eventableObj) {

        //Privates
        var channels = {},
            GLOBAL_CHANNEL_NAME = '__global__';

        function Channel(name) {
            this._name = name;
            this._topics = {};
            this.externalInterface = createChannelInterface(this);
        }

        Channel.prototype.getTopic = function(topicName) {
            if (typeof topicName === 'string') {

                if (!(topicName in this._topics)) {
                    this._topics[topicName] = new Topic(topicName);
                }

                return this._topics[topicName];
            }
        };

        Channel.prototype.subscribe = function(topicName, callback, context) {
            var topic = this.getTopic(topicName);

            if (topic) {
                var subscription = {
                    callback: callback,
                    context: context
                };
                topic._subscriptions.push(subscription);
            }
        };

        Channel.prototype.publish = function(topicName, eventObj) {
            var topic;

            if (typeof topicName === 'string') {
                topic = this.getTopic(topicName);
                for(var i = 0, len = topic._subscriptions.length; i < len; i++) {
                    var sub = topic._subscriptions[i];
                    sub.callback.call(sub.context, eventObj);
                }
            }
        };

        Channel.prototype.unsubscribe = function(subscription) {
            var args = Array.prototype.slice.call(arguments),
                topic = args[0],
                callback = args[1],
                callbackContext = args[2],
                callbackIndex;

            if (typeof topic === 'string') {
                topic = this.getTopic(topic);

                topic.removeSubscriptionByCallback(callback, callbackContext);

                if (topic._subscriptions.length === 0) {
                    delete this._topics[topic._name];
                }
            } else {
                for(var i = 0, len = this._topics.length; i < len; i++) {
                    this._topics[i].removeSubscriptionByCallback();
                }

                this._topics = [];
            }
        };

        function Topic(name) {
            this._name = name;
            this._subscriptions = [];
        }

        Topic.prototype.callSubscriptions = function(eventObj) {
            var sub;
            for(var i = 0, len = this._subscriptions.length; i < len; i++) {
                sub = this._subscriptions[i];
                sub.callback.call(sub.context, eventObj);
            }
        };

        Topic.prototype.removeSubscription = function(subscription) {
            var subIndex;
            subIndex = indexOf(this._subscriptions, subscription);
            if (subIndex !== -1) {
                delete this._subscriptions[subIndex];
                this._subscriptions.splice(subIndex, 1);
            }
        };

        Topic.prototype.removeSubscriptionByCallback = function(callback, context) {
            var topic = this;
            if (typeof callback !== 'function') {
                this._subscriptions = [];
            } else {
                var sub;
                for(var i = 0, len = this._subscriptions.length; i < len; i++) {
                    sub = this._subscriptions[i];
                    if (sub.callback === callback) {
                        if (!context || sub.context === context) {
                            topic.removeSubscription(sub);
                        }
                    }
                }
            }
        };

        function getChannel(channelName) {
            var channel;
            if (typeof channelName === 'string') {
                if (channelName in channels) {
                    channel = channels[channelName];
                } else {
                    channel = channels[channelName] = new Channel(channelName);
                }
            } else {
                channel = getGlobalChannel(GLOBAL_CHANNEL_NAME);
            }

            return channel.externalInterface;
        }

        function getGlobalChannel() {
            return (channels[GLOBAL_CHANNEL_NAME] =
                    channels[GLOBAL_CHANNEL_NAME] || new Channel(GLOBAL_CHANNEL_NAME));
        }

        function createGlobalChannelAction(action) {
            return function() {
                var globalChannel = getChannel(GLOBAL_CHANNEL_NAME);
                globalChannel[action].apply(globalChannel, arguments);
                return globalChannel;
            };
        }

        eventableObj.channel = getChannel;
        eventableObj.publish = createGlobalChannelAction('publish');
        eventableObj.subscribe = createGlobalChannelAction('subscribe');
        eventableObj.unsubscribe = createGlobalChannelAction('unsubscribe');
    }

    makeEventworks(Eventworks);
    Eventworks.makeEventworks = makeEventworks;
})(window.Eventworks = window.Eventworks || {});
