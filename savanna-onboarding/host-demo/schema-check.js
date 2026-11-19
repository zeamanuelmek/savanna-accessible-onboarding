/* Host demo: checks each record against the JSON Schemas published in docs/api-schema.md.
   The schemas are read from that Markdown file itself (every ```json block with a "$id", plus the shared "$defs"
   block), so the check can never drift from the documentation. A small validator for the JSON Schema 2020-12
   keywords the document uses: type, enum, const, properties, required, additionalProperties, items, minItems,
   minimum, maximum, oneOf, not, $ref (#/$defs/...) and format "date". No dependency. Works in the browser and in Node. */
(function (root) {
  'use strict';

  /** Event name -> schema $id (the table "Which schema checks which event" in docs/api-schema.md). */
  var EVENT_SCHEMAS = {
    'savanna-onboarding:ready': 'savanna-onboarding/no-detail',
    'savanna-onboarding:audioblocked': 'savanna-onboarding/no-detail',
    'savanna-onboarding:prefs': 'savanna-onboarding/prefs',
    'savanna-onboarding:step': 'savanna-onboarding/step',
    'savanna-onboarding:complete': 'savanna-onboarding/complete'
  };

  /** Reads the schemas out of the Markdown text: { byId: { $id: schema }, defs: { name: schema } }. */
  function parseSchemas(markdown) {
    var byId = {}, defs = {}, re = /```json\s*\n([\s\S]*?)```/g, m, problems = [];
    while ((m = re.exec(markdown))) {
      var obj;
      try { obj = JSON.parse(m[1]); } catch (e) { problems.push('A JSON block could not be read: ' + e.message); continue; }
      if (!obj || typeof obj !== 'object') continue;
      if (obj.$defs) Object.keys(obj.$defs).forEach(function (k) { defs[k] = obj.$defs[k]; });
      if (typeof obj.$id === 'string') byId[obj.$id] = obj;
    }
    return { byId: byId, defs: defs, problems: problems };
  }

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
    return typeof v;
  }
  function typeOk(v, want) {
    var got = typeOf(v);
    return (Array.isArray(want) ? want : [want]).some(function (w) { return w === got || (w === 'number' && got === 'integer'); });
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /** Validates `value` against `schema`. Returns a list of plain-English problems (empty = pass). */
  function validate(value, schema, defs, path) {
    var errs = [], here = path || '(root)';
    if (!schema || typeof schema !== 'object') return errs;
    if (schema.$ref) {
      var name = String(schema.$ref).replace(/^#\/\$defs\//, '');
      if (!defs[name]) return [here + ': unknown reference ' + schema.$ref];
      errs = errs.concat(validate(value, defs[name], defs, here));
    }
    if (schema.type && !typeOk(value, schema.type)) return errs.concat([here + ': should be ' + [].concat(schema.type).join(' or ') + ', is ' + typeOf(value)]);
    if (schema.enum && !schema.enum.some(function (x) { return same(x, value); })) errs.push(here + ': ' + JSON.stringify(value) + ' is not one of ' + JSON.stringify(schema.enum));
    if ('const' in schema && !same(schema.const, value)) errs.push(here + ': should be ' + JSON.stringify(schema.const));
    if (typeof value === 'number') {
      if (typeof schema.minimum === 'number' && value < schema.minimum) errs.push(here + ': below ' + schema.minimum);
      if (typeof schema.maximum === 'number' && value > schema.maximum) errs.push(here + ': above ' + schema.maximum);
    }
    if (schema.format === 'date' && typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errs.push(here + ': not a date (YYYY-MM-DD)');
    if (Array.isArray(value)) {
      if (typeof schema.minItems === 'number' && value.length < schema.minItems) errs.push(here + ': needs at least ' + schema.minItems + ' item(s)');
      if (schema.items) value.forEach(function (x, i) { errs = errs.concat(validate(x, schema.items, defs, here + '[' + i + ']')); });
    }
    if (value && typeOf(value) === 'object') {
      var props = schema.properties || {};
      (schema.required || []).forEach(function (k) { if (!(k in value)) errs.push(here + ': "' + k + '" is missing'); });
      Object.keys(value).forEach(function (k) {
        if (props[k]) errs = errs.concat(validate(value[k], props[k], defs, here === '(root)' ? k : here + '.' + k));
        else if (schema.additionalProperties === false) errs.push(here + ': "' + k + '" is not in the schema');
      });
    }
    if (schema.oneOf) {
      var passing = schema.oneOf.filter(function (s) { return !validate(value, s, defs, here).length; }).length;
      if (passing !== 1) errs.push(here + ': should match exactly one allowed shape (matches ' + passing + ')');
    }
    if (schema.not && !validate(value, schema.not, defs, here).length) errs.push(here + ': has a shape that is not allowed');
    return errs;
  }

  /** Checks one event: { ok, checked: [$id, ...], errors: [...] }. */
  function checkEvent(name, detail, schemas) {
    var id = EVENT_SCHEMAS[name];
    if (!id) return { ok: false, checked: [], errors: ['No schema is documented for ' + name] };
    var main = schemas.byId[id];
    if (!main) return { ok: false, checked: [], errors: ['Schema ' + id + ' was not found in api-schema.md'] };
    var checked = [id], errors = validate(detail, main, schemas.defs);
    if (name === 'savanna-onboarding:complete' && detail && typeof detail === 'object') {
      var aid = 'savanna-onboarding/answers/' + detail.form, as = schemas.byId[aid];
      if (as) { checked.push(aid); errors = errors.concat(validate(detail.answers, as, schemas.defs, 'answers')); }
      else errors.push('No answers schema ' + aid + ' in api-schema.md');
    }
    return { ok: !errors.length, checked: checked, errors: errors };
  }

  var api = { EVENT_SCHEMAS: EVENT_SCHEMAS, parseSchemas: parseSchemas, validate: validate, checkEvent: checkEvent };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SchemaCheck = api;
})(this);
