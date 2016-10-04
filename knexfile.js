'use strict';

module.exports = {
  development: {
     client: 'pg',
     onnection: 'postgres://localhost/bookshelf_dev'},

  test: {
       client: 'pg',
       connection: 'postgres://localhost/bookshelf_test'},

  production: {}
};
