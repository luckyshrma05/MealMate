export const positiveId = (raw) => {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
};

export function validateObject(body, required = [], allowed = [], partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Expected a JSON object';
  const keys = Object.keys(body);
  if (partial && !keys.length) return 'At least one field must be provided';
  if (keys.some(key => !allowed.includes(key))) return 'Unknown or forbidden field';
  if (!partial && required.some(key => !Object.hasOwn(body, key))) return 'Missing required fields';
  return null;
}

export const nameString = (v, max = 100) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
export const positiveInt = v => Number.isSafeInteger(v) && v > 0;
export const nonnegativeFinite = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export const percent = v => nonnegativeFinite(v) && v <= 100;
export const bool = v => typeof v === 'boolean';
export function parseDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === v ? d : null;
}
export function eventInput(body, partial = false) {
  const fields = ['name','eventType','eventDate','guestCount','bufferPercent'];
  const err = validateObject(body,fields.slice(0,4),fields,partial);
  if (err) return {error:err};
  const data = {};
  for (const key of ['name','eventType']) if (Object.hasOwn(body,key)) {
    if (!nameString(body[key])) return {error:`Invalid ${key}`};
    data[key] = body[key].trim();
  }
  if (Object.hasOwn(body,'eventDate')) {
    const date = parseDate(body.eventDate);
    if (!date) return {error:'eventDate must be a valid YYYY-MM-DD date'};
    data.eventDate = date;
  }
  if (Object.hasOwn(body,'guestCount')) {
    if (!positiveInt(body.guestCount)) return {error:'guestCount must be a positive integer'};
    data.guestCount = body.guestCount;
  }
  if (Object.hasOwn(body,'bufferPercent')) {
    if (!percent(body.bufferPercent)) return {error:'bufferPercent must be from 0 to 100'};
    data.bufferPercent = body.bufferPercent;
  }
  return {data};
}
export function sendError(res, err, label='Request') {
  if (err?.code === 'P2002') return res.status(409).json({message:'Record already exists'});
  if (err?.code === 'P2003') return res.status(409).json({message:'Record is referenced by other records'});
  if (err?.code === 'P2025') return res.status(404).json({message:'Record not found'});
  console.error(`${label} failed`,err);
  return res.status(500).json({message:'Internal server error'});
}
