/**
 * Shared calculation utilities for dashboard cards and conditional rendering.
 * Extracted from: declarative-ui-engine, generative-ui-chat, generative-ui-turbo
 */

/**
 * Calculate a dashboard metric value from items array.
 * @param {Object[]} items - Data items
 * @param {Object} card - Card config { calc, field?, where?, prefix?, fn? }
 * @returns {number|string}
 */
export function calcCard(items, card) {
  let filtered = items;
  if (card.where) {
    filtered = items.filter(i =>
      Object.entries(card.where).every(([k, v]) => i[k] === v)
    );
  }
  switch (card.calc) {
    case 'count':
      return filtered.length;
    case 'sum':
      return card.field
        ? filtered.reduce((s, i) => s + (Number(i[card.field]) || 0), 0)
        : 0;
    case 'avg':
      if (!card.field || filtered.length === 0) return 0;
      return (
        filtered.reduce((s, i) => s + (Number(i[card.field]) || 0), 0) /
        filtered.length
      ).toFixed(1);
    case 'custom':
      return typeof card.fn === 'function' ? card.fn(filtered) : 0;
    default:
      return 0;
  }
}

/**
 * Format a calculated value with optional prefix.
 * @param {number|string} val
 * @param {Object} card - Card config { prefix? }
 * @returns {string}
 */
export function formatCardValue(val, card) {
  if (card.prefix) return `${card.prefix} ${Number(val).toLocaleString('pt-BR')}`;
  return String(val);
}

/**
 * Determine if a field should be visible based on showIf condition.
 * @param {Object} fieldConf - Field config { showIf?: { field, equals } }
 * @param {Object} formData - Current form values
 * @returns {boolean}
 */
export function shouldShow(fieldConf, formData) {
  if (!fieldConf?.showIf) return true;
  return formData[fieldConf.showIf.field] === fieldConf.showIf.equals;
}

/**
 * Auto-generate dashboard config from field definitions.
 * @param {Object} fields - Field definitions { name: { type, options? } }
 * @returns {Object} Dashboard config { cards, charts }
 */
export function autoDash(fields) {
  const cards = [{ label: 'Total', calc: 'count' }];
  const charts = [];

  Object.entries(fields).forEach(([name, conf]) => {
    if (conf.type === 'select' && conf.options?.length) {
      charts.push({ type: 'bar', groupBy: name, label: `Por ${name}` });
      conf.options.forEach(opt => {
        cards.push({ label: opt, calc: 'count', where: { [name]: opt } });
      });
    }
    if (conf.type === 'number' || conf.prefix) {
      cards.push({ label: `Total ${name}`, calc: 'sum', field: name, prefix: conf.prefix });
    }
  });

  return { cards: cards.slice(0, 6), charts: charts.slice(0, 3) };
}
