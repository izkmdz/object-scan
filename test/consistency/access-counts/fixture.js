export default {
  obj: {
    a: {
      b: {
        c: {},
        d: {},
        e: {}
      }
    }
  },
  needles: [
    'a.b.c',
    '**.*',
    'a.b.d',
    'a.b.e',
    'a.*.e',
    '**.e',
    '*.*',
    '**.b.c',
    'a.b'
  ],
  expected: [
    ['a.b.e', 'a.b.e', {}],
    ['a.b.e', 'a.*.e', {}],
    ['a.b.e', '**.*', {}],
    ['a.b.e', '**.e', {}],
    ['a.b.d', 'a.b.d', {}],
    ['a.b.d', '**.*', {}],
    ['a.b.c', 'a.b.c', {}],
    ['a.b.c', '**.*', {}],
    ['a.b.c', '**.b.c', {}],
    ['a.b', 'a.b', { c: {}, d: {}, e: {} }],
    ['a.b', '**.*', { c: {}, d: {}, e: {} }],
    ['a.b', '*.*', { c: {}, d: {}, e: {} }],
    ['a', '**.*', { b: { c: {}, d: {}, e: {} } }]
  ]
};
