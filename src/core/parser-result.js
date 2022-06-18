import assert from '../generic/assert.js';
import { Value } from './value.js';
import { Ref } from './ref.js';

const throwError = (msg, input, context = {}) => {
  throw new Error(Object.entries(context)
    .reduce((p, [k, v]) => `${p}, ${k} ${v}`, `${msg}: ${input}`));
};

const getSimple = (arrOrSet) => {
  if (Array.isArray(arrOrSet)) {
    return arrOrSet.length === 1 ? arrOrSet[0] : arrOrSet;
  }
  return arrOrSet.size === 1 ? arrOrSet.values().next().value : arrOrSet;
};

const arraySelectorRegex = /^[?*+\d]+$/;

export default (input) => {
  let cResult = new Set();
  let inArray = false;
  let excludeNext = false;
  let cursor = 0;

  // group related
  const parentStack = [];
  const newChild = (asOr) => {
    if (cResult.excluded === true) {
      assert(excludeNext === false);
      excludeNext = true;
    }
    parentStack.push(cResult);
    cResult = asOr ? new Set() : [];
  };
  const finishChild = () => {
    const parent = parentStack.pop();
    const parentIsArray = Array.isArray(parent);
    const child = getSimple(cResult);
    if (!parentIsArray && child instanceof Set) {
      child.forEach((e) => parent.add(e));
    } else {
      parent[parentIsArray ? 'push' : 'add'](child);
    }
    cResult = parent;
  };

  newChild(false);

  return {
    setInArray: (flag, idx) => {
      if (inArray === flag) {
        throwError(inArray ? 'Bad Array Start' : 'Bad Array Terminator', input, { char: idx });
      }
      inArray = flag;
    },
    finishElement: (idx, err, fins, { finReq = false, group = false } = {}) => {
      const isFinished = cursor === idx;
      if (isFinished) {
        if (!fins.includes(input[idx - 1] || null)) {
          throwError(err, input, { char: idx });
        }
        cursor += 1;
      } else {
        if (finReq) {
          throwError(err, input, { char: idx });
        }
        const ele = input.slice(cursor, idx);
        if (group && !['**', '++'].includes(ele)) {
          throwError('Bad Group Start', input, { char: idx });
        }
        if (inArray && !(
          arraySelectorRegex.test(ele)
          || (ele.startsWith('(') && ele.endsWith(')'))
        )) {
          throwError('Bad Array Selector', input, { selector: ele });
        }
        if (group) {
          cResult.push(new Ref(ele));
        } else {
          cResult.push(new Value(inArray ? `[${ele}]` : ele, excludeNext));
          excludeNext = false;
        }
        cursor = idx + 1;
      }
    },
    startExclusion: (idx) => {
      if (excludeNext !== false) {
        throwError('Redundant Exclusion', input, { char: idx });
      }
      excludeNext = true;
    },
    startGroup: () => {
      newChild(true);
      if (excludeNext) {
        cResult.excluded = true;
        excludeNext = false;
      }
      newChild(false);
    },
    newGroupElement: () => {
      finishChild();
      newChild(false);
    },
    finishGroup: (idx) => {
      if (parentStack.length < 2) {
        throwError('Unexpected Group Terminator', input, { char: idx });
      }
      finishChild();
      finishChild();
      assert(Array.isArray(cResult));
      const refMaybe = cResult[cResult.length - 2];
      if (refMaybe instanceof Ref && refMaybe.left === true) {
        cResult.push(refMaybe.link);
      }
    },
    finalizeResult: () => {
      finishChild();
      assert(excludeNext === false);
      if (parentStack.length !== 0) {
        throwError('Non Terminated Group', input);
      }
      if (inArray) {
        throwError('Non Terminated Array', input);
      }
      return getSimple(cResult);
    }
  };
};
