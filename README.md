## Description

- This module is for creating MongoDB connection pools.

## Note

1. Since it seems bitbucket branch tag doesn't work for `npm install`, so we use master branch.

## Usages

- Code sample

  ```
  const BuildMongoDBConnPools = require('mongodb-conn-pools');
  const buildMongoDBConnPools = new BuildMongoDBConnPools(['10.0.1.6:27017', '10.0.2.101:27017'], 'VCUBE_MESSENGER_DB_INT2', {
    maxPoolSize: 2
  });

  buildMongoDBConnPools.buildMongoDBConnPools().each((inspection) => {
    if (inspection.isFulfilled()) {
      // Here, this Promise is successfully fulfilled, inspection.value() will be the corresponding connection pool instance.
    } else {
      // Here, this Promise is failed to be fulfilled, inspection.reason() will tell you what is the reason.
    }
  })
  ```

>

- The lib is using [bluebird Promise](http://bluebirdjs.com/docs/api-reference.html), so when the `buildMongoDBConnPools` function is invoked, a [bluebird Promise Inspection](http://bluebirdjs.com/docs/api/reflect.html) array will be returned.

- Since [node-mongodb-native driver](https://github.com/mongodb/node-mongodb-native) will always pick up the first db host from your connection url, only when the before hosts were down then the later hosts will be used, so for the load balance purpose, here we maintain multiple small connection pools, lets say we have three hosts:

  - ['host0:port0', 'host1:port1', 'host2:port2']

  - Then according to the [Sudoku Strategy](./lib/SudokuConsts.js), the `buildMongoDBConnPools` function will return the following three connection pools:

  ```
  mongodb://host0:port0,host2:port2,host1:port1
  mongodb://host1:port1,host0:port0,host2:port2
  mongodb://host2:port2,host1:port1,host0:port0
  ```

>

- And also along with the lib, a [random pickup strategy](./lib/util/Util.js) is provided.


