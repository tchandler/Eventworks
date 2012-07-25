/*
 * Eventworks
 * Why I Wrote It?
 *   To experiment
 *   To facilitate loosely coupled communications between modules
 *   To allow better organized events with Channels
 * How it works?
 *   Channel, Topic and Subject prototypes
 *   Limit API exposure with a channel wrapper
 *   Root object does Channel construction and defaults to global channel for
 *     publish, subscribe, and unpublish
 *   Chainable API
 *   First instance also functional inheritor
 * What I learned
 *   How to structure modules
 *   Call/apply can't be stored (Obvious in retrospect)
 *   How to write a chainable API
 *   Using function generators to simplify API design
 *   How to create external APIs
 *   How to do functional inheritance
 * Future features
 *   Callback priority
 *   Callback queuing, prevent callbacks from overlapping and cap consecutive publishes
 *   Optional synchronicity
 *   Nested channels
 *   Possibily promises from subscriptions (breaks chaining?)
 *   Some form of cross channel piping
 *   Allow multi-event subscription with a delimeter and/or array
 *   Better open-closed support
 *     Optional handler on the extended object to get deeper access to allow extension of internals?
 *     Second argument which exposes internals?
 *   Cross platform support (Node)
 */

(function (Eventworks) {
	
	//Helpers
	var slice = Array.prototype.slice,
		//modified each from underscore.js
		each = function(obj, iterator, context) {
			if (obj == null) return;
			if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (i in obj) iterator.call(context, obj[i], i, obj);
			}
			} else {
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key, obj);
					}
				}
			}
		},
		//modified indexOf from underscore.js
		indexOf = function (array, item) {
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
			GLOBAL_CHANNEL_NAME = "__global__";

		function Channel(name) {
			this._name = name;
			this._topics = {};
			this.externalInterface = createChannelInterface(this);
		}

		Channel.prototype.getTopic = function(topicName) {
			if(typeof topicName === "string") {
				if(topicName in this._topics){
					return this._topics[topicName];
				} else {
					return this._topics[topicName] = new Topic(topicName);
				}
			}
		};

		Channel.prototype.subscribe = function(topicName, callback, context) {
			var topic = this.getTopic(topicName),
				subscription = new Subscription(callback, context);

			topic.addSubscription(subscription);
		};

		Channel.prototype.publish = function(topicName, eventObj) {
			var topic;

			if(typeof topicName === "string") {
				topic = this.getTopic(topicName);
				topic.callSubscriptions(eventObj);
			}
		};

		Channel.prototype.unsubscribe = function(subscription) {
			var args = slice.call(arguments),
				topic = args[0],
				callback = args[1],
				callbackContext = args[2],
				callbackIndex;

			if(typeof topic === "string") {
				topic = this.getTopic(topic);

				topic.removeSubscriptionByCallback(callback, callbackContext);

				if(topic.isEmpty()) {
					delete this._topics[topic._name];
				}
			} else {
				each(this._topics, function (topic) {
					topic.removeSubscriptionByCallback();
				});

				this._topics = [];
			}
		};

		function Topic (name) {
			this._name = name;
			this._subscriptions = [];
		}

		Topic.prototype.callSubscriptions = function(eventObj) {
			each(this._subscriptions, function(sub) {
				sub.fire(eventObj);
			});
		};

		Topic.prototype.addSubscription = function(subscription) {
			if(subscription instanceof Subscription) {
				this._subscriptions.push(subscription);
			}
		};

		Topic.prototype.removeSubscription = function(subscription) {
			var subIndex;
			if(subscription instanceof Subscription) {
				subIndex = indexOf(this._subscriptions, subscription);
				if(subIndex !== -1) {
					delete this._subscriptions[subIndex];
					this._subscriptions.splice(subIndex, 1);
				}
			}
		};

		Topic.prototype.removeSubscriptionByCallback = function(callback, context) {
			var topic = this;
			if (typeof callback !== "function") {
				this._subscriptions = [];
			} else {
				each(this._subscriptions, function(sub) {
					if(sub.callback === callback) {
						if(!context || sub.context === context) {
							topic.removeSubscription(sub);
						}
					}
				});
			}
		};

		Topic.prototype.isEmpty = function () {
			return this._subscriptions.length === 0;
		};

		function Subscription (callback, context) {
			this.callback = callback;
			this.context = context;
		}

		Subscription.prototype.fire = function(eventObj) {
			var sub = this;
			setTimeout(function() {
				sub.callback.call(sub.context, eventObj);
			}, 0);
		};

		function getChannel(channelName) {
			var channel;
			if(typeof channelName === "string") {
				if(channelName in channels) {
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
			if(channels[GLOBAL_CHANNEL_NAME] === undefined) {
				channels[GLOBAL_CHANNEL_NAME] = new Channel(GLOBAL_CHANNEL_NAME);
			}

			return channels[GLOBAL_CHANNEL_NAME];
		}

		function createGlobalChannelAction(action) {
			return function() {
				var globalChannel = getChannel(GLOBAL_CHANNEL_NAME);
				globalChannel[action].apply(globalChannel, arguments);
				return globalChannel;
			};
		}

		eventableObj.channel = getChannel;
		eventableObj.publish = createGlobalChannelAction("publish");
		eventableObj.subscribe = createGlobalChannelAction("subscribe");
		eventableObj.unsubscribe = createGlobalChannelAction("unsubscribe");
	}

	makeEventworks(Eventworks);
	Eventworks.makeEventworks = makeEventworks;
})(window.Eventworks = window.Eventworks || {});


var someChannel = Eventworks.channel("some channel")
	.subscribe("some event", function() { console.log("some code");})
	.publish("some event");

Eventworks.makeEventworks(obj);
obj.channel().subscribe().publish().unsubscribe();