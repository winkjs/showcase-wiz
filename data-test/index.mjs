const fetch = require('cross-fetch');

fetch('localhost:8877/en.bin').then(function (r) {
  console.log(r);
});
