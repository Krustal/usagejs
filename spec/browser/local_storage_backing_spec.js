var Usage = require('../../src/usage.js');
var sinon = require('sinon');
var moment = require('moment');
require('twix');

describe('Using localStorage as backing storage', function(){
  var mockLocalStorage = {};

  beforeEach(function() {
    // freeze time to right now, so we can test various time sensitive features
    this.clock = sinon.useFakeTimers(moment().valueOf());

    // mock localStorage
    spyOn(localStorage, 'setItem').and.callFake(function(key, value){
      mockLocalStorage[key] = String(value);
    });

    spyOn(localStorage, 'getItem').and.callFake(function(key){
      return mockLocalStorage[key];
    });
  });

  afterEach(function() {
    this.clock.restore();
    mockLocalStorage = {};
  });

  function generalUsage(){
    return new Usage({
      storage: {
        write: function(data) {
          localStorage.setItem('history', JSON.stringify(data));
        },
        read: function() {
          return JSON.parse(localStorage.getItem('history') || '{}');
        }
      }
    });
  }

  describe('initialization', function() {
    it("backs itself up to storage on initialization", function(){
      generalUsage();
      expect(JSON.parse(mockLocalStorage.history).lastCleaned).toEqual(moment().valueOf());
    });
  });

  describe('when data is stored in localStorage when initialized', function(){
    var time, history;

    beforeEach(function(){
      time = moment().startOf('day').valueOf();

      history = {
        events: []
      };

      history.events.push({
        time: time,
        type: 'person search',
        properties: {
          fname: 'jon',
          lname: 'snow',
          location: 'seattle, wa'
        }
      });
      localStorage.setItem('history', JSON.stringify(history));
    });

    it('rebuilds the history from localStorage', function(){
      expect(generalUsage().events[0]).toEqual(history.events[0]);
    });
  });

});