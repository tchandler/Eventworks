Eventworks
=========
---
Eventworks is a channeled pub sub system.  What does that mean exactly?

Similarly named events belonging to different modules are put on their own channels:

```javascript
var module1Channel = Eventworks.channel('module1');
module1Channel.subscribe('update', function(info) {
  console.log('Update module 1 ' + info);
});
module1Channel.publish('update', 'info to pass');

var module2Channel = Eventworks.channel('module2');
module1Channel.subscribe('update', function(info) {
  console.log('update module 2 ' + info); //update module 2 info to pass
});
module2Channel.publish('update', 'info to pass');
```

---

As long as a shared reference to the Eventworks object is available, all channels and topics can be listened to.  But if you need something more private, you can extend any object with it's own Eventworks instance.  Now your module's internals can communicte with the same interface they use to communicate externally.

```javascript
var myModule = {};
//Adds channel, publish, subscribe, unsubscribe methods to object.
Eventworks.makeEventworks(myModule);

//All of this is a wholly separate Eventworks instance.
var internalChannel = myModule.channel('internalChannel');
internalChannel.subscribe('internalTopic', someCallback)
internalChannel.publish('internalTopic');
```