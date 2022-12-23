# az-router

`az-router` is library for dynamic nested routes

## Installation
With npm
```sh
npm install az-router
```
or with yarn
```sh
yarn add az-router
```

## Usage
```js
// With ES Module
import azRouter from 'az-router'

// Or CommonJS
const { default: azRouter } = require('az-router')
```

### Example:
```js
const app = express()
const router = azRouter({
  routeDir: 'routes', // optional, propose relative path where contains route modules, default is `routes` directory inside current working directory
  absolutePath: '/path/to/another/routes', // optional, absolute path of `routes` directory. If this exists, this will be overrided `routeDir` option
  baseRouter: express.Router(), // optional, default is express.Router()
  ext: ['js', 'cjs', 'mjs', 'ts'], // optional, propose file module extensions to importing, default is ['js']
  debug: true, // optional, default is false
})
app.use(router)
app.listen(8080)
```

With below file tree:
```
routes/
--| users/
-----| middleware.js
-----| post.js
-----| _id/
-------| get.js
--| books/
-----| _bookId/
--------| authors/
-----------| _authorId/
-------------| get.js
--| get.js
```

will be generated express Route path:
```
/users
/users/:id
/books/:bookId/authors/:authorId
/
```

### Use methods and middlewares:
Using under any method file
```js
// get.js
const middle = (req, res, next) => {
  console.log('foo')
  next()
}
const middle2 = (req, res, next) => {
  console.log('bar')
  next()
}

// With ES Module
export default (req, res) => {
  console.log(req.params.id)
  res.send('req.params.id is ' + req.params.id)
}
export const middleware = [middle, middle2]

// Or CommonJS
exports = module.exports = (req, res) => {
  console.log(req.params.id)
  res.send('req.params.id is ' + req.params.id)
}
exports.middleware = [middle, middle2]
```

Using under any file `middleware.js`

```js
// middleware.js
const middleware01 = (req, res, next) => {
  cosole.log('middleware01')
  next()
}
const middleware02 = (req, res, next) => {
  cosole.log('middleware02')
  next()
}

// With ES Module
export { middleware01, middleware02 }

// Or CommonJS
exports.middleware01 = middleware01
exports.middleware02 = middleware02
```
If use middleware overall, should set it the execution file

## License
MIT
