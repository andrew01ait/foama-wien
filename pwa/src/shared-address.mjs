import {normalizedStationName as key} from './station-search.mjs?v=0.12.3';

const house = /\s+\d{1,5}(?:\s?[a-z])?(?:\s*[-–/]\s*\d+[a-z]?)*$/iu;
const streetEnding = /(?:straße|strasse|str\.|gasse|platz|ring|weg|allee|gürtel|kai|zeile|lände|steig|promenade|markt|ufer|brücke)$/iu;
const country = /^(?:Österreich|Austria|Deutschland|Germany|Schweiz|AT|DE|CH)$/iu;
const genericPin = 'Geteilter Kartenpunkt';
const streetKey = street => key(street.replace(house, ''));
const locality = ({zip, city}) => [zip, city].filter(Boolean).join(' ');
export const postalAddress = address => [address.street, locality(address)].filter(Boolean).join(', ');
export const hasHouseNumber = street => house.test(street);

// Handles both one-line Maps labels and address lines from a text selection.
// Postcodes and house-number suffixes stay strings throughout.
export function addressParts(...values) {
  const groups = values.filter(Boolean).map(value => String(value)
    .replace(/(\S)\s+(?=(?:A[T]?-)?\d{4,5}\s+\p{L})/gu, '$1, ')
    .split(/[\n,·]+/u).map(part => part.trim()).filter(part =>
      part && !country.test(part) && !/(?:https?:\/\/|^geo:)/i.test(part)));
  const parts = groups.flat();
  const postals = parts.map(part => part.match(/^(?:A[T]?-)?(\d{4,5})(?:\s+(\p{L}.*))?$/iu)).filter(Boolean);
  const postal = postals[0];
  const street = parts.find(part => /\p{L}/u.test(part) && house.test(part) && !/^\d{4,5}\s/u.test(part))
    || parts.find(part => streetEnding.test(part)) || '';
  const group = groups.find(parts => parts.includes(street));
  const afterStreet = group?.[group.indexOf(street) + 1];
  const postalGroup = postal && groups.find(parts => parts.includes(postal[0]));
  const afterZip = postalGroup?.[postalGroup.indexOf(postal[0]) + 1];
  const candidate = postal ? afterZip : afterStreet;
  const city = postals.find(match=>match[1]===postal[1] && match[2])?.[2]
    || (candidate && /^[\p{L}][\p{L} .’'-]*$/u.test(candidate) ? candidate : '');
  return {street, zip: postal?.[1] || '', city};
}

export function completeAddress(address) {
  return house.test(address.street) && !!address.zip && !!address.city;
}

function isAddressLabel(label, address) {
  return [address.street, postalAddress(address), locality(address)].some(value => value && key(value) === key(label))
    || !!address.street && key(label) === streetKey(address.street);
}

// An explicit POI keeps its name. A shared postal address gets a street line
// and a locality line, even when the map URL names only the street.
export function describeSharedPin(point, text = '', title = '') {
  const address = addressParts(text, point.detail, point.name, title);
  if (!address.street && !address.zip) return point;
  let label = point.name;
  if (label === genericPin || isAddressLabel(label, address) || addressParts(label).zip || (label.includes(',') && addressParts(label).street)) {
    const firstLine = [text.split(/[\n,]/)[0], title, point.name.split(',')[0]].find(candidate => candidate && candidate !== genericPin
      && !isAddressLabel(candidate, address) && !addressParts(candidate).street && !addressParts(candidate).zip);
    label = firstLine || address.street || genericPin;
  }
  const detail = (isAddressLabel(label, address) ? locality(address) : postalAddress(address)).slice(0, 160);
  return {...point, name: label, ...(detail ? {detail} : {})};
}

export function compatibleAddress(wanted, actual) {
  return (!wanted.street || streetKey(wanted.street) === streetKey(actual.street))
    && (!house.test(wanted.street) || key(wanted.street) === key(actual.street))
    && (!wanted.zip || !actual.zip || wanted.zip === actual.zip)
    && (!wanted.city || !actual.city || key(wanted.city) === key(actual.city));
}

export function keepSearchAddress(row, wanted) {
  if (row.kind !== 'address' || !wanted.street) return row;
  const actual = addressParts([row.name, row.detail].filter(Boolean).join(', '));
  if (!compatibleAddress(wanted, actual) || !((wanted.zip && !actual.zip) || (wanted.city && !actual.city))) return row;
  const extra = (row.detail || '').split(' · ').slice(1);
  const detail = locality({zip:actual.zip || wanted.zip, city:actual.city || wanted.city});
  return {...row, detail:[detail,...extra].join(' · ')};
}

export function addressNearPin(point, places) {
  // A POI can contain a number in its name. Prefer the explicit address line.
  const known = addressParts(point.detail, [point.name, point.detail].filter(Boolean).join(', '));
  for (const row of places) {
    const actual = addressParts([row.name, row.detail].filter(Boolean).join(', '));
    if (!actual.street || !compatibleAddress(known, actual)) continue;
    const merged = {street: actual.street, zip: known.zip || actual.zip, city: known.city || actual.city};
    if (house.test(known.street)) {
      const detail = isAddressLabel(point.name, known) ? locality(merged) : postalAddress(merged);
      if (detail && detail !== point.detail) return detail;
    } else {
      return 'Adresse in der Nähe: ' + postalAddress(merged);
    }
  }
  return '';
}
