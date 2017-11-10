# ![RealWorld Example App](logo.png)

> ### [Moleculer](http://moleculer.services/) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld) spec and API.

This repo is functionality complete — PRs and issues welcome!
For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

**Live demo on Glitch: https://realworld-moleculer.glitch.me**

Glitch: https://glitch.com/edit/#!/realworld-moleculer


## Getting started

### To get the Node server running locally:

- Clone this repo
- `npm install` to install all required dependencies
- Install MongoDB Community Edition ([instructions](https://docs.mongodb.com/manual/installation/#tutorials)) and run it by executing `mongod`
- `npm run dev` to start the local server
- the API is available at http://localhost:3000/api

Alternately, to quickly try out this repo in the cloud, you can 

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/realworld-moleculer)

### To get the Node server running locally with Docker
TODO

## Code Overview

### Dependencies

- [moleculer](https://github.com/ice-services/moleculer) - Microservices framework for NodeJS
- [moleculer-web](https://github.com/ice-services/moleculer-web) - Official API Gateway service for Moleculer
- [moleculer-db](https://github.com/ice-services/moleculer-addons/tree/master/packages/moleculer-db#readme) - Database service for Moleculer
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - For generating JWTs used by authentication
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Hashing user password
- [lodash](https://github.com/lodash/lodash) - Utility library
- [slug](https://github.com/dodo/node-slug) - For encoding titles into a URL-friendly format

### Application Structure

- `moleculer.config.js` - Moleculer ServiceBroker configuration file.
- `services/` - This folder contains the services.
- `public/` - This folder contains the front-end static files.
- `data/` - This folder contains the NeDB database files.

## Test
```
$ npm test
```

In development with watching

```
$ npm run ci
```

## License
This project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact
Copyright (c) 2016-2017 Ice-Services

[![@ice-services](https://img.shields.io/badge/github-ice--services-green.svg)](https://github.com/ice-services) [![@MoleculerJS](https://img.shields.io/badge/twitter-MoleculerJS-blue.svg)](https://twitter.com/MoleculerJS)