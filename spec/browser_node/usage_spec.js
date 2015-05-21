var Usage = require('../../src/usage.js');
var sinon = require('sinon');
var _ = require('underscore');
var moment = require('moment');
require('twix');
var context = describe;

describe('usage.js', function() {

  var storage = {};
  var genConfig = {
    storage: {
      write: function(data) {
        storage = data;
      },
      read: function() {
        return storage;
      }
    }
  };

  function generalUsage(){
    return Usage.create(genConfig);
  }

  beforeEach(function() {
    // freeze time to right now, so we can test various time sensitive features
    this.clock = sinon.useFakeTimers(moment().valueOf());
    storage = {};
  });

  afterEach(function(){
    this.clock.restore();
  });

  it('makes Usage class available globally', function(){
    expect(typeof Usage).not.toBe('undefined');
  });

  describe('initialization', function() {
    it("returns instance of Usage", function(){
      expect(generalUsage()).toEqual(jasmine.any(Usage));
    });
    it("backs itself up to storage on initialization", function(){
      generalUsage();
      expect(storage.lastCleaned).toEqual(moment().valueOf());
    });

    it("if no existing data in storage it sets last cleaned to today", function(){
      expect(generalUsage().lastCleaned).toEqual(moment().valueOf());
    });
    it("automatically cleans history if lastCleaned is older than start of today", function(){
      // put event in storage with timestamp more than 62 days ago
      var lastUsage = generalUsage();
      expect(lastUsage.lastCleaned).toEqual(moment().valueOf());
      this.clock.tick(moment.duration(1, 'day').asMilliseconds());
      var usage = generalUsage();
      expect(usage.lastCleaned).toEqual(moment().valueOf());
    });
    it("doesn't automatically clean history if lastCleaned is after the start of today", function(){
      var oldUsage = generalUsage(),
          oldLastCleaned = oldUsage.lastCleaned;
      this.clock.tick(moment.duration(2, 'hours').asMilliseconds());
      var usage = generalUsage();
      expect(usage.lastCleaned).toEqual(oldLastCleaned);
    });
    it("correctly removes events older than ttl", function(){
      var oldUsage = generalUsage();
      oldUsage.log('too old');
      expect(oldUsage.events.length).toEqual(1);
      this.clock.tick(moment.duration(63, 'days').asMilliseconds());
      var usage = generalUsage();
      expect(usage.events.length).toEqual(0);
    });
  });

  describe('setting ttl on Usage objects', function(){
    it("defaults expiration date to 62 days", function(){
      expect(generalUsage().expires.valueOf()).toBe(moment().subtract(62, 'days').valueOf());
    });
    it("sets expiration date based on passed ttl", function(){
      var usage = new Usage(_.extend(genConfig, {
        ttl: moment.duration(31, 'days')
      }));
      expect(usage.expires.valueOf()).toBe(moment().subtract(31, 'days').valueOf());
    });
  });

  describe('logging events', function(){
    var usage;

    beforeEach(function(){
      usage = generalUsage();
    });

    it("appends a new event to usage", function(){
      var oldEventCount = usage.events.length;
      usage.log('person search', {fname: 'john', lname: 'snow', location: 'seattle, wa'});
      expect(usage.events.length).toBeGreaterThan(oldEventCount);
    });

    it("new events are tagged with current time", function(){
      usage.log('person search', {fname: 'john', lname: 'snow', location: 'seattle, wa'});
      expect(usage.events[0].time).toEqual(moment().valueOf());
    });

    it("automatically backs itself up to storage", function(){
      usage.log('stored in localStorage');
      expect(storage.events[0].type).toEqual('stored in localStorage')
    });
  });

  describe('eventsWithin', function(){
    var usage, firstTime, secondTime, thirdTime;

    beforeEach(function(){
      usage = generalUsage();

      firstTime = moment();
      usage.log('click');

      this.clock.tick(moment.duration(2, 'days').asMilliseconds());

      secondTime = moment();
      usage.log('click', { item: 'car' });
      usage.log('copy');

      this.clock.tick(moment.duration(2, 'days').asMilliseconds());

      thirdTime = moment();
      usage.log('click');
      usage.log('open');
    });

    context('when just passed a date range', function(){
      it('returns events in that range', function(){
        expect(usage.eventsWithin(firstTime.twix(secondTime)).length).toEqual(3);
      });
    });

    context('when passed date range and type', function(){
      it('returns events of that type occuring within the range', function(){
        expect(usage.eventsWithin(secondTime.twix(thirdTime), 'copy').length).toEqual(1);
      });
    });

    context('when passed date range and multiple types', function(){
      it('returns events of that type occuring within the range', function(){
        expect(usage.eventsWithin(firstTime.twix(thirdTime), ['copy', 'open']).length).toEqual(2);
      });
    });

    context('when given a function for further reduction', function(){
      it('returns only qualifying events within the time range', function(){
        expect(usage.eventsWithin(firstTime.twix(thirdTime), ['click', 'open'], function(event){
          return event.properties.item === 'car'
        }).length).toEqual(1);
      });
    });
  });
});