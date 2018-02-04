'use strict';

/*
 * Note:
 *   Here we only support 'Connection String Options', refer to the below link:
 *     https://docs.mongodb.com/manual/reference/connection-string/#connections-standard-connection-string-format
 *   So, this means all the options here will be appended to connect url directly, no nested object support.
 *
 *   For those complicated 'node-mongodb-native driver options' please refer to the below link:
 *     http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html
 */

const _flattenConnOpts = (dbName, connOpts) => {
  let connOptStr = '/' + dbName + '?';
  connOptStr = Object.keys(connOpts).reduce((acc, curr) => {
    return acc = acc + curr + '=' + connOpts[curr] + '&';
  }, connOptStr);
  return connOptStr.length === 2 ? '' : connOptStr.slice(0, -1);
};

const _buildConnUrls = (mongodbServers, dbName, connOpts) => {
  const flattenedConnOptStr = _flattenConnOpts(dbName, connOpts);

  const scenario = require('./SudokuConsts')[mongodbServers.length];
  const mongodbConnUrls = [];

  for (let i = 0; i < scenario.length; i++) {
    let tmp = '';
    for (let j = 0; j < scenario.length; j++) {
      tmp = tmp + mongodbServers[scenario[i][j]] + ',';
    }
    mongodbConnUrls.push('mongodb://' + tmp.slice(0, -1) + flattenedConnOptStr);
  }

  return mongodbConnUrls;
};

module.exports = (consulKVMongoDBServerKey) => {

  if (!consulKVMongoDBServerKey || typeof consulKVMongoDBServerKey !== 'string') {
    throw new Error('Invalid consul cluster KV store key for mongodb server info.');
  }

  const consul = require('microservice-consul');

  const Promise = require('bluebird');
  const connect = Promise.promisify(require('mongodb').MongoClient.connect);

  return consul.agents[0].kv.get(consulKVMongoDBServerKey).then((res) => {
    if (!res) {
      return Promise.reject('None mongodb server record found in consul kv store by this key.');
    }

    const mongodbServerInfo = JSON.parse(res.Value);

    const connectUrls = _buildConnUrls(mongodbServerInfo.hosts, mongodbServerInfo.dbName, mongodbServerInfo.connOpts);
    const doConnect = [];
    for (let i = 0; i < connectUrls.length; i++) {
      doConnect.push(connect(connectUrls[i]));
    }

    const dbPools = [];

    return Promise.all(doConnect.map((promise) => {
      return promise.reflect();
    })).each((inspection) => {
      if (inspection.isFulfilled()) {
        dbPools.push(inspection.value());
      }
    }).return(dbPools);
    
  });

};


