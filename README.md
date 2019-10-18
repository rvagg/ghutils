# ghutils

[![Build Status](https://api.travis-ci.com/rvagg/ghutils.svg?branch=master)](https://travis-ci.com/rvagg/ghutils)

**A collection of utility functions for dealing with the GitHub API**

[![NPM](https://nodei.co/npm/ghissues.svg)](https://nodei.co/npm/ghissues/)

Used by:

* [ghissues](https://github.com/rvagg/ghissues) - a Node.js library to interact with the GitHub Issues API
* [ghpulls](https://github.com/rvagg/ghpulls) - a Node.js library to interact with the GitHub Pull Request API
* [ghrepos](https://github.com/rvagg/ghrepos) - a Node.js library to interact with the GitHub Repos API
* [ghusers](https://github.com/rvagg/ghusers) - a Node.js library to interact with the GitHub Users API
* [ghteams](https://github.com/rvagg/ghteams) - a Node.js library to interact with the GitHub Teams API
* [ghreleases](https://github.com/ralphtheninja/ghreleases) - a Node.js library to interact with the GitHub Releases API

## API

### makeOptions(auth, options)

Helper to make options to pass to [jsonist](http://github.com/rvagg/jsonist) given a GitHub auth from [ghauth](https://github.com/rvagg/ghauth) and any additional options.

### handler(callback)

Takes a JSON response from the GitHub API and turns any errors and applies them properly to the `callback`.

### ghpost(auth, url, data, options, callback)

Make a GitHub API compatible POST request to the given URL via [jsonist](http://github.com/rvagg/jsonist), uses `makeOptions()` to extend the options. Requires a GitHub auth from [ghauth](https://github.com/rvagg/ghauth) and any additional options.

### ghget(auth, url, options, callback)

Make a GitHub API compatible GET request to the given URL via [jsonist](http://github.com/rvagg/jsonist), uses `makeOptions()` to extend the options. Requires a GitHub auth from [ghauth](https://github.com/rvagg/ghauth) and any additional options.

### lister(auth, urlbase, options, callback)

Given a paginated url resource, recursively fetch all available pages of data and return an array containing the complete list.

### apiRoot

The api root url `'https://api.github.com'`.

## License & Copyright

**ghutils** is Copyright (c) 2015 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE.md file for more details.
