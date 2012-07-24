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
});