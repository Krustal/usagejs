var _ = require('underscore');
var moment = require('moment');
require('twix');

(function(root, factory) {
  'use strict';
  if (typeof exports === 'object') {
      module.exports = factory();
  } else {
      root.please = factory(root);
  }
})(this, function(root){
  'use strict';

  var exports = {};

  // Usage provides access to historic visits and searches performed on the site for
  // use in custom analytic variables
  var Usage = function(properties){
    this.ttl = (properties && properties.ttl) || moment.duration(62, 'days');
    var expires = this.expires = moment().subtract(this.ttl);

    this.storage = properties.storage;

    var storedUsage = getFromStorage(this.storage);
    this.lastCleaned = storedUsage.lastCleaned;
    if(this.lastCleaned < moment().startOf('day').valueOf()) {
      this.events = _.reject(storedUsage.events, function(event){
        return event.time < expires;
      });
      this.lastCleaned = moment().valueOf();
    } else {
      this.events = storedUsage.events;
    }

    this.backup();
  };

  Usage.create = function(properties){
    return new Usage(properties);
  }

  // Fetches history from whatever storage mechanism is indicated at the given
  // key. It then returns an object. Takes a single object as a parameter with
  // the following keys.
  //
  // @param <string> method The storage mechanism to use (localStorage, cookie) (default: 'cookie')
  // @param <string> key The key used to access the stored history. (default: 'history')
  var getFromStorage = function(storage){
    var storedHistory = storage.read() || {};
    storedHistory.events = storedHistory.events || [];
    storedHistory.lastCleaned = storedHistory.lastCleaned || moment().valueOf();
    return storedHistory;
  };

  Usage.prototype.log = function(type, properties){
    this.events.push({
      time: moment().valueOf(),
      type: type,
      properties: properties
    });
    this.backup();
    return this;
  }

  Usage.prototype.serialize = function(){
    return {events: this.events, lastCleaned: this.lastCleaned};
  }

  Usage.prototype.backup = function(){
    this.storage.write(this.serialize());
  };

  Usage.fn = Usage.prototype;

  exports = Usage;
  return exports;
});
