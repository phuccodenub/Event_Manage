const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'VN' },
  { name: 'organizationName', value: 'HUTECH' },
  { name: 'organizationalUnitName', value: 'Event Management' }
];

const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
  extensions: [
    { name: 'basicConstraints', cA: true },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 2, value: '*.localhost' },
        { type: 2, value: 'hutech.event.local' }
      ]
    }
  ]
});

fs.writeFileSync(path.join(__dirname, 'cert.pem'), pems.cert);
fs.writeFileSync(path.join(__dirname, 'key.pem'), pems.private);
