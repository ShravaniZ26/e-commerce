'use strict';

const { Client } = require('@elastic/elasticsearch');
const config = require('./index');

const clientOptions = {
  node: config.elasticsearch.node,
};

if (config.elasticsearch.username && config.elasticsearch.password) {
  clientOptions.auth = {
    username: config.elasticsearch.username,
    password: config.elasticsearch.password,
  };
}

/**
 * Configured Elasticsearch client instance.
 * @type {import('@elastic/elasticsearch').Client}
 */
const elasticsearchClient = new Client(clientOptions);

module.exports = elasticsearchClient;
