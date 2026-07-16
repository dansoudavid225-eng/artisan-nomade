const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAll(collection) {
  const { data, error } = await supabase.from(collection).select('*');
  if (error) {
    console.error(`Supabase findAll(${collection}) error:`, error.message);
    return [];
  }
  return data || [];
}

async function findOne(collection, field, value) {
  const { data, error } = await supabase.from(collection).select('*').eq(field, value).limit(1);
  if (error) {
    console.error(`Supabase findOne(${collection}) error:`, error.message);
    return null;
  }
  return data?.[0] || null;
}

async function insertOne(collection, doc) {
  const { data, error } = await supabase.from(collection).insert(doc).select().single();
  if (error) {
    console.error(`Supabase insertOne(${collection}) error:`, error.message);
    return null;
  }
  return data;
}

async function updateById(collection, id, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(collection).update(updates).eq('id', id).select().single();
  if (error) {
    console.error(`Supabase updateById(${collection}) error:`, error.message);
    return null;
  }
  return data;
}

async function emailExists(collection, email) {
  const { data, error } = await supabase.from(collection).select('id').eq('email', email).limit(1);
  if (error) {
    console.error(`Supabase emailExists(${collection}) error:`, error.message);
    return false;
  }
  return data && data.length > 0;
}

async function writeCollection(collection, docs) {
  // Delete all then re-insert (for seed/reset operations)
  const { error: delErr } = await supabase.from(collection).delete().neq('id', '_');
  if (delErr) {
    console.error(`Supabase writeCollection(${collection}) delete error:`, delErr.message);
    return;
  }
  if (docs.length > 0) {
    const { error: insErr } = await supabase.from(collection).insert(docs);
    if (insErr) console.error(`Supabase writeCollection(${collection}) insert error:`, insErr.message);
  }
}

async function updateByField(collection, field, value, updates) {
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from(collection).update(updates).eq(field, value).select().single();
  if (error) {
    console.error(`Supabase updateByField(${collection}) error:`, error.message);
    return null;
  }
  return data;
}

module.exports = { insertOne, findOne, findAll, updateById, updateByField, emailExists, writeCollection };
