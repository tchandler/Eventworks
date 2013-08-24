describe("Eventworks", function() {
	var defaultChannel = Eventworks.channel(),
		namedChannel = Eventworks.channel("namedChannel");

	it("has a default channel", function() {
		expect(typeof defaultChannel.publish === "function");
		expect(typeof defaultChannel.subscribe === "function");
		expect(typeof defaultChannel.unsubscribe === "function");
	});

	it("should create named channels", function() {
		expect(typeof namedChannel.publish === "function");
		expect(typeof namedChannel.subscribe === "function");
		expect(typeof namedChannel.unsubscribe === "function");
		expect(namedChannel !== defaultChannel);
	});

	it("should create the same channels given the same name", function() {
		expect(namedChannel === Eventworks.channel("namedChannel"));
	});

	it("should handle empty strings", function() {
		expect(defaultChannel === Eventworks.channel(false));
	});

	it("should fire events correctly", function() {
		var fireCount = 0;
		defaultChannel.subscribe('testEvent', function() {
			fireCount++;
		});

		defaultChannel.publish('testEvent');
		expect(fireCount === 1);
		defaultChannel.publish('anotherEvent');
		expect(fireCount === 1);
	});

	it("should set the callback context correctly", function() {
		var context = {
			fireCount: 0
		};
		defaultChannel.subscribe('testEvent', function() {
			this.fireCount++;
		}, context);

		defaultChannel.publish('testEvent');
		expect(context.fireCount === 1);
		defaultChannel.publish('anotherEvent');
		expect(context.fireCount === 1);
	});

	it("should unsubscribe events correctly", function () {
		var fireCount = 0;
		var callback = function() {
			fireCount += 2;
		};

		//Register event with anonymous callback
		defaultChannel.subscribe('testEvent', function() {
			fireCount++;
		});

		//Register event with callback that has handle preserved
		defaultChannel.subscribe('testEvent', callback);
		defaultChannel.publish('testEvent');
		expect(fireCount === 3);

		//Only unsubscribe event that's using registered callback
		defaultChannel.unsubscribe('testEvent', callback);
		defaultChannel.publish('testEvent');
		expect(fireCount === 4);

		//Unsubscribe all remaining events
		defaultChannel.unsubscribe('testEvent');
		defaultChannel.publish('testEvent');
		expect(fireCount === 4);
	});

	it("should allow separate named channels", function () {
		var fireCount = 0;

		//Register event with anonymous callback
		defaultChannel.subscribe('testEvent', function() {
			fireCount++;
		});

		namedChannel.subscribe('testEvent', function() {
			fireCount++;
		});

		//Publish only to default channel
		defaultChannel.publish('testEvent');
		expect(fireCount === 1);

		//Publish only to named channel
		namedChannel.publish('testEvent');
		expect(fireCount === 2);
	});

	it("should allow isolated Eventworks instances", function() {
		var Eventworks2 = {};
		Eventworks.makeEventworks(Eventworks2);
		expect(Eventworks2.channel);
		expect(Eventworks2.publish);
		expect(Eventworks2.subscribe);
		expect(Eventworks2.unsubscribe);

		var defaultChannel2 = Eventworks2.channel();
		expect(defaultChannel2 != defaultChannel);

		var namedChannel2 = Eventworks2.channel('namedChannel');
		expect(namedChannel2 != namedChannel);

		var fireCount = 0;

		//Register event with anonymous callback
		defaultChannel.subscribe('testEvent', function() {
			fireCount++;
		});

		defaultChannel2.subscribe('testEvent', function() {
			fireCount++;
		});

		//Publish only to default channel on original instance
		defaultChannel.publish('testEvent');
		expect(fireCount === 1);

		//Publish only to default channel on new instance
		defaultChannel2.publish('testEvent');
		expect(fireCount === 2);
	});
});
