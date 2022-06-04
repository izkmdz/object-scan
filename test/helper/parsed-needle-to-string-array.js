import Joi from 'joi-strict';

const parsedNeedleToStringArray = (obj, params, rng, depth = 0) => {
  const isArray = Array.isArray(obj);
  const isSet = obj instanceof Set;
  if (isArray || isSet) {
    const r = (isArray ? obj : [...obj])
      .map((e) => parsedNeedleToStringArray(e, params, rng, depth + 1));
    const len = r.length;
    if (len === 0) {
      return depth === 0 ? [] : '';
    }
    if (isSet && depth === 0) {
      return r;
    }
    const rStr = r.map((e) => (e.value === undefined ? e : e.value));
    const pullExcludeOut = !isArray
      && depth !== 0
      && rStr.length > 1
      && rStr.every((e) => e.startsWith('!') || e.startsWith('[!'));
    const str = rStr.reduce((prev, next_) => {
      const next = pullExcludeOut ? next_.replace(/^(\[?)!/, '$1') : next_;
      if (prev === null) {
        return next;
      }
      if (isSet) {
        return `${prev},${next}`;
      }
      return `${prev}${next.startsWith('[') ? '' : '.'}${next}`;
    }, null);
    if (depth === 0) {
      return [str];
    }
    const asBlank = isArray || len === 1;
    const groupType = asBlank || rng === null || params.doubleStarGroup === 0 || params.doublePlusGroup === 0
      ? ''
      : (() => {
        const type = rng() > 0.5 ? '**' : '++';
        const set = rng() < (type === '**' ? params.doubleStarGroup : params.doublePlusGroup);
        return set ? type : '';
      })();
    return [
      pullExcludeOut ? '!' : '',
      asBlank ? '' : `${groupType}{`,
      str,
      asBlank ? '' : '}'
    ].join('');
  }
  return depth === 0 ? [obj] : obj;
};

// todo: unit test for params and rng
export default (obj, params_ = {}, rng = null) => {
  const params = {
    doublePlusGroup: 0,
    doubleStarGroup: 0,
    ...params_
  };
  Joi.assert(params, Joi.object().keys({
    doublePlusGroup: Joi.number().min(0).max(1),
    doubleStarGroup: Joi.number().min(0).max(1)
  }));
  return parsedNeedleToStringArray(obj, params, rng);
};
