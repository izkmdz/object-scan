const objectScanReleased = require('object-scan');
const objectScanLocal = require('../src/index');

const callSignature = require('./helper/call-signature');

process.on('message', ({
  haystack, needles, useArraySelector, reverse, useLocal
}) => {
  const result = callSignature({
    objectScan: useLocal ? objectScanLocal : objectScanReleased,
    haystack,
    needles,
    reverse,
    useArraySelector
  });
  process.send(result);
});

process.on('exit', () => {
  process.exit(0);
});
