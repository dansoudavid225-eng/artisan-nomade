const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COLLECTIONS_WITH_UPDATED_AT = new Set(['commandes', 'contenu']);

async function findAll(collection) {
  try {
    const { data, error } = await supabase.from(collection).select('*');
    if (error) {
      console.error(`Supabase findAll(${collection}) error:`, error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error(`Supabase findAll(${collection}) exception:`, e.message);
    return [];
  }
}

async function findOne(collection, field, value) {
  try {
    const { data, error } = await supabase.from(collection).select('*').eq(field, value).limit(1);
    if (error) {
      console.error(`Supabase findOne(${collection}) error:`, error.message);
      return null;
    }
    return data?.[0] || null;
  } catch (e) {
    console.error(`Supabase findOne(${collection}) exception:`, e.message);
    return null;
  }
}

async function insertOne(collection, doc) {
  try {
    const { data, error } = await supabase.from(collection).insert(doc).select().single();
    if (error) {
      console.error(`Supabase insertOne(${collection}) error:`, error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error(`Supabase insertOne(${collection}) exception:`, e.message);
    return null;
  }
}

async function updateById(collection, id, updates) {
  if (COLLECTIONS_WITH_UPDATED_AT.has(collection)) {
    updates.updated_at = new Date().toISOString();
  }
  try {
    const { data, error } = await supabase.from(collection).update(updates).eq('id', id).select().single();
    if (error) {
      console.error(`Supabase updateById(${collection}) error:`, error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error(`Supabase updateById(${collection}) exception:`, e.message);
    return null;
  }
}

async function emailExists(collection, email) {
  try {
    const { data, error } = await supabase.from(collection).select('id').eq('email', email).limit(1);
    if (error) {
      console.error(`Supabase emailExists(${collection}) error:`, error.message);
      return false;
    }
    return data && data.length > 0;
  } catch (e) {
    console.error(`Supabase emailExists(${collection}) exception:`, e.message);
    return false;
  }
}

async function writeCollection(collection, docs) {
  try {
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
  } catch (e) {
    console.error(`Supabase writeCollection(${collection}) exception:`, e.message);
  }
}

async function updateByField(collection, field, value, updates) {
  if (COLLECTIONS_WITH_UPDATED_AT.has(collection)) {
    updates.updated_at = new Date().toISOString();
  }
  try {
    const { data, error } = await supabase.from(collection).update(updates).eq(field, value).select().single();
    if (error) {
      console.error(`Supabase updateByField(${collection}) error:`, error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error(`Supabase updateByField(${collection}) exception:`, e.message);
    return null;
  }
}

async function deleteById(collection, id) {
  try {
    const { error } = await supabase.from(collection).delete().eq('id', id);
    if (error) {
      console.error(`Supabase deleteById(${collection}) error:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Supabase deleteById(${collection}) exception:`, e.message);
    return false;
  }
}

module.exports = { insertOne, findOne, findAll, updateById, updateByField, deleteById, emailExists, writeCollection };
