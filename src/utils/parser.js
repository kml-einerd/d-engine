/**
 * Field shorthand parser and converter.
 * Extracted from: generative-ui-turbo, ui-builder-canvas, ui-builder-v4
 *
 * Shorthand syntax:
 *   nome!        → { type: "text", required: true }
 *   email@       → { type: "email" }
 *   valor$       → { type: "number", prefix: "R$" }
 *   quantidade#  → { type: "number" }
 *   descricao... → { type: "textarea" }
 *   status:A|B|C → { type: "select", options: ["A", "B", "C"] }
 */

/**
 * Parse shorthand string into field definitions object.
 * @param {string} shorthand - Space-separated field tokens
 * @returns {Object} Field definitions
 */
export function parseFieldShorthand(shorthand) {
  const fields = {};
  if (!shorthand || typeof shorthand !== 'string') return fields;

  shorthand.trim().split(/\s+/).forEach(token => {
    let name = token;
    let type = 'text';
    let required = false;
    let options = null;
    let prefix = undefined;

    // Required marker
    if (name.endsWith('!')) {
      required = true;
      name = name.slice(0, -1);
    }

    // Type suffixes
    if (name.includes(':')) {
      const [n, opts] = name.split(':');
      name = n;
      type = 'select';
      options = opts.split('|').map(o => o.trim()).filter(Boolean);
    } else if (name.endsWith('@')) {
      name = name.slice(0, -1);
      type = 'email';
    } else if (name.endsWith('$')) {
      name = name.slice(0, -1);
      type = 'number';
      prefix = 'R$';
    } else if (name.endsWith('#')) {
      name = name.slice(0, -1);
      type = 'number';
    } else if (name.endsWith('...')) {
      name = name.slice(0, -3);
      type = 'textarea';
    }

    if (name) {
      const field = { type };
      if (required) field.required = true;
      if (options) field.options = options;
      if (prefix) field.prefix = prefix;
      fields[name] = field;
    }
  });

  return fields;
}

/**
 * Convert field definitions back to shorthand string.
 * @param {Object} fields - Field definitions
 * @returns {string} Shorthand string
 */
export function fieldsToShorthand(fields) {
  return Object.entries(fields)
    .map(([name, conf]) => {
      let token = name;
      if (conf.type === 'select' && conf.options?.length) {
        token += ':' + conf.options.join('|');
      } else if (conf.type === 'email') {
        token += '@';
      } else if (conf.type === 'number' && conf.prefix) {
        token += '$';
      } else if (conf.type === 'number') {
        token += '#';
      } else if (conf.type === 'textarea') {
        token += '...';
      }
      if (conf.required) token += '!';
      return token;
    })
    .join(' ');
}

/**
 * Expand a turbo-format config into full declarative config.
 * @param {Object} turbo - Turbo config { use?, entity, fields, dash?, include? }
 * @param {Object} presets - Available presets
 * @returns {Object} Full APP_CONFIG
 */
export function expandConfig(turbo, presets = {}) {
  const config = {};

  Object.entries(turbo).forEach(([key, val]) => {
    let pageConfig = val;

    // If using a preset, start from that
    if (val.use && presets[val.use]) {
      pageConfig = { ...presets[val.use], ...val };
    }

    // Parse shorthand fields
    if (typeof pageConfig.fields === 'string') {
      pageConfig = {
        ...pageConfig,
        crud: {
          fields: parseFieldShorthand(pageConfig.fields),
        },
      };
      delete pageConfig.fields;
    }

    // Auto-generate dashboard
    if (pageConfig.dash === 'auto' && pageConfig.crud?.fields) {
      const { autoDash } = require('./calculations');
      pageConfig.dash = autoDash(pageConfig.crud.fields);
    }

    config[key] = pageConfig;
  });

  return config;
}
