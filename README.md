# UsageJS

[![Build Status](https://travis-ci.org/Krustal/usagejs.svg?branch=master)](https://travis-ci.org/Krustal/usagejs)

> *A simple library for tracking user actions and events.*

## Features

Log events into storage mechanism of your choice (e.g. localStorage, cookies, RESTful API, etc.). Events are
stored with corresponding timestamp in order to support querying based on time blocks.

Events are automatically backed up to backing store and events occuring earlier than ttl are cleaned out.

## Usage

UsageJS is best used with Browserify at the moment. It should work in traditional browser environment but
testing is less rigourous so expect that to not be as stable.

**Example**: localStorage backed (using Browserify)

```JavaScript
var Usage = require('usagejs')['Usage'];

var usage = new Usage({
  storage: {
    write: function(data) {
      localStorage.setItem('history', JSON.stringify(data));
    },
    read: function() {
      return JSON.parse(localStorage.getItem('history') || '{}');
    }
  }
});

usage.log('usagejs configured');

console.log(usage.events.length);
```

If this was placed on a page on your site the first time the console would output 1, the second time 2,
third 3, etc.

The purpose behdind this library is to support buiding features that trigger or are otherwise based on user
behavior on the site. It is not an analytics library though its events could be used to build reports for
general behavior.

## API

```new Usage(properties)```

Creates a new Usage object.

properties [Object] - A basic JavaScript object, with the following attributes.

* storage - relates to the backing storage
  * write [function] - a function that takes a single field `data` with the usage properties. It should store
  the data in a serialized fashion it can recover it from.
  * read [function] - Takes no parameters but should return at least an empty javascript object. Typically it should return the deserialized object stored in the write callback.
* ttl [moment duration] - momentjs duration object indicating how long events are allowed to remain in storage. (default: 62 days)

```usageObject.log(type, properties)```

Logs an event in usage.

type [String] - A string that generically labels the event into a group to be easily searched in the future.

properties [Object] - This can be any data you want to attribute with the event. While technically it can be in any form it is recommended that events of the same type conform to a standardized schema.

```JavaScript
usageObject.serialize()
```

Returns a plain JavaScript object with events and last cleaned date. Used internally by the backup function to store backup the usage data.

```JavaScript
usageObject.backup()
```

Called automatically when an event is logged. This function can also be used to automatically backup whatever is currently stored in the usage object.

## Support

Should support all modern browsers.

## Development

1. Fork it
2. Clone your fork: ```git clone git@github.com:userName/usagejs.git```
3. ```cd usagejs```
4. Add upstream ```git remote add upstream https://github.com/Krustal/usagejs.git```
5. Confirm your up to date ```git fetch upstream```
6. Build it: ```npm install```
7. Test it: ```npm test```
8. Create a feature branch ```git checkout -b feature-branch```
9. Write your code
10. Commit your changes ```git commit```
11. Push to your fork ```git push origin feature-branch```
12. Create a Pull Request

### Testing

Run all the tests (node & browser)
```
npm test
```

Run only node tests
```
jasmine
```

Run only browser tests (defaults to PhantomJS)
```
karma start karma.conf.js
```
or test specific browsers (currently has Chrome, Firefox, IE, Safari, PhantomJS)
```
karma start karma.conf.js --browsers [browsers to test]
```
