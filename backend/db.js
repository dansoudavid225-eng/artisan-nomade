/**
 * db.js – Base de données JSON légère (remplace SQLite)
 * Stocke les données dans /data/*.json
 * Parfait pour démarrer – migrer vers PostgreSQL en production si nécessaire
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Lire une collection JSON
 * @param {string} name – ex: 'commandes', 'newsletter', 'contacts'
 */
function readCollection(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Écrire une collection JSON
 */
function writeCollection(name, data) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Ajouter un document à une collection
 */
function insertOne(collection, doc) {
  const data = readCollection(collection);
  data.push(doc);
  writeCollection(collection, data);
  return doc;
}

/**
 * Trouver par champ
 */
function findOne(collection, field, value) {
  const data = readCollection(collection);
  return data.find(item => item[field] === value) || null;
}

/**
 * Tous les documents
 */
function findAll(collection) {
  return readCollection(collection);
}

/**
 * Mettre à jour par ID
 */
function updateById(collection, id, updates) {
  const data = readCollection(collection);
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
  writeCollection(collection, data);
  return data[idx];
}

/**
 * Vérifier si un email existe déjà dans une collection
 */
function emailExists(collection, email) {
  const data = readCollection(collection);
  return data.some(item => item.email === email);
}

module.exports = { insertOne, findOne, findAll, updateById, emailExists, writeCollection };
