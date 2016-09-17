# distributed-jwt-cracker

An experimental distributed JWT token cracker built using Node.js and ZeroMQ.
It can be used to discover the password (or "secret") of an unencrypted JWT token
using a **HS256** signature.

[![npm version](https://badge.fury.io/js/distributed-jwt-cracker.svg)](http://badge.fury.io/js/distributed-jwt-cracker)
[![Build Status](https://travis-ci.org/lmammino/distributed-jwt-cracker.svg?branch=master)](https://travis-ci.org/lmammino/distributed-jwt-cracker)
[![codecov.io](https://codecov.io/gh/lmammino/distributed-jwt-cracker/coverage.svg?branch=master)](https://codecov.io/gh/lmammino/distributed-jwt-cracker)


## Install

Through NPM:

```bash
npm i -g distributed-jwt-cracker
```

Requires [ZeroMq libraries](http://zeromq.org/intro:get-the-software) to be already installed in your machine.

## Usage

### Server
To start a new server:

```bash
jwt-cracker-server <jwtToken> [options]
```

The following options are available:

| option | description | type | default |
| --- | --- | --- | --- |
| -p, --port | The port used to accept incoming connections | number | 9900 |
| -P, --pubPort | The port used to publish signals to all the workers | number | 9901 |
| -a, --alphabet | The alphabet used to generate the passwords | string | "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789" |
| -b, --batchSize | The number of attempts assigned to every client in a batch | number | 1000000 |
| -s, --start | The index from where to start the search | number | 0 |

Example, using the example [JWT.io](https://jwt.io) token over a simple alphabet:

```bash
jwt-cracker-server eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ -a=abcdefghijklmnopqrstuwxyz
```

### Client

To start a new client:

```bash
jwt-cracker-client [options]
```

The following options are available:

| option | description | type | default |
| --- | --- | --- | --- |
| -h, --host | The hostname of the server | string | "localhost" |
| -p, --port | The port used to connect to the batch server | number | 9900 |
| -P, --pubPort | The port used to subscribe to broadcast signals (e.g. exit) | number | 9901 |

Example:

```bash
jwt-cracker-client --host=localhost --port=9900 --pubPort=9901
```


## Contributing

Everyone is very welcome to contribute to this project.
You can contribute just by submitting bugs or suggesting improvements by
[opening an issue on GitHub](https://github.com/lmammino/distributed-jwt-cracker/issues).


## License

Licensed under [MIT License](LICENSE). © Luciano Mammino.
