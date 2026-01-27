# ghutils

**A collection of utility functions for dealing with the GitHub API**

[![NPM](https://nodei.co/npm/ghutils.svg?style=flat&data=n,v&color=blue)](https://nodei.co/npm/ghutils/)

Used by:

* [ghissues](https://github.com/rvagg/ghissues) - a Node.js library to interact with the GitHub Issues API
* [ghpulls](https://github.com/rvagg/ghpulls) - a Node.js library to interact with the GitHub Pull Request API
* [ghrepos](https://github.com/rvagg/ghrepos) - a Node.js library to interact with the GitHub Repos API
* [ghusers](https://github.com/rvagg/ghusers) - a Node.js library to interact with the GitHub Users API
* [ghteams](https://github.com/rvagg/ghteams) - a Node.js library to interact with the GitHub Teams API
* [ghreleases](https://github.com/ralphtheninja/ghreleases) - a Node.js library to interact with the GitHub Releases API

## Requirements

- Node.js >= 20

## Example

```js
import { ghget, lister } from 'ghutils'

const auth = { token: 'your-github-token' }

// Make a single GET request
const { data } = await ghget(auth, 'https://api.github.com/user')
console.log(data)

// List all items from a paginated endpoint
const issues = await lister(auth, 'https://api.github.com/repos/owner/repo/issues')
console.log(issues)
```

## API

All methods return Promises and use native `fetch` internally.

### apiRoot

The API root URL: `'https://api.github.com'`

### makeOptions(auth, options)

Helper to build request options with proper headers. Accepts a GitHub auth object from [ghauth](https://github.com/rvagg/ghauth) (containing a `token` property) and optional additional options.

### ghget(auth, url, options)

Make a GitHub API compatible GET request to the given URL. Returns `{ data, res }` where `data` is the parsed JSON response and `res` is the fetch Response object.

```js
const { data, res } = await ghget(auth, 'https://api.github.com/user')
```

### ghpost(auth, url, data, options)

Make a GitHub API compatible POST request with JSON body.

```js
const { data } = await ghpost(auth, 'https://api.github.com/repos/owner/repo/issues', {
  title: 'New issue',
  body: 'Issue description'
})
```

### ghpatch(auth, url, data, options)

Make a GitHub API compatible PATCH request with JSON body.

```js
const { data } = await ghpatch(auth, 'https://api.github.com/repos/owner/repo/issues/1', {
  state: 'closed'
})
```

### ghdelete(auth, url, options)

Make a GitHub API compatible DELETE request.

```js
await ghdelete(auth, 'https://api.github.com/repos/owner/repo/issues/1/labels/bug')
```

### lister(auth, urlbase, options)

Given a paginated URL resource, recursively fetch all available pages of data and return an array containing the complete list.

Options:
- `afterDate` - A `Date` object; only return items with `created_at` after this date
- Any other options are passed as query parameters (e.g., `state`, `per_page`)

```js
// Get all open issues
const issues = await lister(auth, 'https://api.github.com/repos/owner/repo/issues', {
  state: 'open',
  per_page: 100
})

// Get issues created after a specific date
const recentIssues = await lister(auth, 'https://api.github.com/repos/owner/repo/issues', {
  afterDate: new Date('2024-01-01')
})
```

## Authentication

All methods accept an `auth` object with a `token` property:

```js
const auth = { token: 'ghp_xxxxxxxxxxxx' }
```

For backwards compatibility with older versions, an object with both `user` and `token` properties is also accepted (the `user` property is ignored).

## License & Copyright

**ghutils** is Copyright (c) 2015-2025 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE.md file for more details.
