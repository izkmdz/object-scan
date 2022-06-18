import { asRegex, escapeRegex } from '../generic/helper.js';

export const parseValue = (str) => {
  let regex = '';
  let escaped = false;
  for (let idx = 0; idx < str.length; idx += 1) {
    const char = str[idx];
    if (!escaped && char === '\\') {
      escaped = true;
    } else if (!escaped && char === '*') {
      regex += '.*';
    } else if (!escaped && char === '+') {
      regex += '.+';
    } else if (!escaped && char === '?') {
      regex += '.';
    } else {
      regex += escapeRegex(char);
      escaped = false;
    }
  }
  return new RegExp(`^${regex}$`);
};

const compileValue = (str) => {
  if (['**', '++'].includes(str)) {
    return asRegex('.*');
  }
  if ((str.startsWith('**(') || str.startsWith('++(')) && str.endsWith(')')) {
    return asRegex(str.slice(3, -1));
  }
  if (str.startsWith('[(') && str.endsWith(')]')) {
    return asRegex(str.slice(2, -2));
  }
  if (str.startsWith('(') && str.endsWith(')')) {
    return asRegex(str.slice(1, -1));
  }
  if (str.startsWith('[') && str.endsWith(']')) {
    return parseValue(str.slice(1, -1));
  }
  return parseValue(str);
};

export class Node {
  constructor(value, ctx) {
    ctx.nodes.push(this);
    this.value = value;
    this.ctx = ctx;
    this.order = ctx.counter;
    this.values = [];
    this.match = false;
    this.matches = false;
    this.needles = [];
    this.leafNeedles = [];
    this.leafNeedlesExclude = [];
    this.leafNeedlesMatch = [];

    this.regex = compileValue(value);
    this.isArrayTarget = value.startsWith('[') && value.endsWith(']');
    this.isSimpleStarRec = value === '**';
    this.isSimplePlusRec = value === '++';
    this.isSimpleRec = this.isSimpleStarRec || this.isSimplePlusRec;
    this.isRegexStarRec = value.startsWith('**(') && value.endsWith(')');
    this.isRegexPlusRec = value.startsWith('++(') && value.endsWith(')');
    this.isRegexRec = this.isRegexStarRec || this.isRegexPlusRec;
    this.isStarRec = this.isSimpleStarRec || this.isRegexStarRec;
    this.isPlusRec = this.isSimplePlusRec || this.isRegexPlusRec;
    this.isRec = this.isStarRec || this.isPlusRec;
    this.isAnyArrayTarget = value === '[*]';
    this.isAnyObjTarget = value === '*';
  }

  recMatch(key) {
    if (!this.isRec) {
      return false;
    }
    if (this.isSimpleRec) {
      return true;
    }
    return this.regex.test(key);
  }

  typeMatch(key, isArray) {
    if (this.isSimpleRec) {
      return true;
    }
    if (isArray && this.isAnyArrayTarget) {
      return true;
    }
    if (!isArray && this.isAnyObjTarget) {
      return true;
    }
    if (
      isArray !== this.isArrayTarget
      && !this.isRec
    ) {
      return false;
    }
    return this.regex.test(key);
  }

  add(v) {
    this.values.push(v);
  }

  has(k) {
    return this.values.some(({ value }) => value === k);
  }

  get(k) {
    return this.values.find(({ value }) => value === k);
  }

  markMatches() {
    this.matches = true;
  }

  addNeedle(needle) {
    if (!this.needles.includes(needle)) {
      this.needles.push(needle);
    }
  }

  setRoots(roots) {
    this.roots = roots;
  }

  finish(needle, excluded, index) {
    this.addNeedle(needle);
    if (!this.leafNeedles.includes(needle)) {
      this.leafNeedles.push(needle);
    }
    const target = excluded ? this.leafNeedlesExclude : this.leafNeedlesMatch;
    if (!target.includes(needle)) {
      target.push(needle);
    }
    this.match = !excluded;
    this.matches = this.match;
    this.index = index;
  }
}
