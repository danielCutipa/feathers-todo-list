const { authenticate } = require('@feathersjs/authentication').hooks;

const getRelated = require('../../hooks/get-related');

module.exports = {
  before: {
    all: [ authenticate('jwt') ],
    find: [getRelated()],
    get: [getRelated()],
    create: [getRelated()],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
