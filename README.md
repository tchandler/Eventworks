Eventworks
=========

Eventworks is a channeled pub sub system.

Basic features:
 * Channel support.
 * Chainable interface, you always get the channel object back from Eventworks calls.
 * Private instances allow you to add a new Eventworks within your modules.

Similarly named events belonging to different modules are put on their own channels:

```javascript
var module1Channel = Eventworks.channel('module1');
module1Channel.subscribe('update', function(info) {
  console.log('Update module 1 ' + info);
});
module1Channel.publish('update', 'info to pass');

var module2Channel = Eventworks.channel('module2');
module1Channel.subscribe('update', function(info) {
  console.log('update module 2 ' + info);
});
module2Channel.publish('update', 'info to pass');
```

---

API
=========

```javascript
//Global default channel object.
Eventworks.channel();

//Can call methods directly on Eventworks, will default to global channel.
Eventworks.subscribe == Eventworks.channel().subscribe;
Eventworks.publish == Eventworks.channel().publish;
Eventworks.unsubscribe == Eventworks.channel().unsubscribe;

//Named channel object.
Eventworks.channel(string channelName);

var channel = Eventworks.channel();

//Subscription callbacks can recieve an argument when called
channel.subscribe(string topicName, function callback);
//They can also be called with a context
channel.subscribe(string topicName, function callback, object context);

//Publish just an event or with an argument for the callback
channel.publish(string topicName);
channel.publish(string topicName, object eventObject);

//Unsubscribe with varying amounts of specificity.
//Removes all subscriptions that match inputs.
channel.unsubscribe();
channel.unsubscribe(string topicName);
channel.unsubscribe(string topicName, function callback);
channel.unsubscribe(string topicName, function callback, object context);

//Interface is chainable.
channel.subscribe('topic', callback).publish('topic').unsubscribe('topic', callback);

//Make a new instance of Eventworks
var newEventworks = Eventworks.makeEventworks();

//Mixin a new instance of Eventworks to an object
//Adds channel, publish, subscribe, unsubscribe methods
//that reference their own new internals
Eventworks.makeEventworks(myModule);

//All of this is a wholly separate Eventworks instance.
var internalChannel = myModule.channel('internalChannel');
internalChannel.subscribe('internalTopic', someCallback)
internalChannel.publish('internalTopic');

internalChannel !== Eventworks.channel('internalChannel');
```