/** Targeted, compare-and-set editorial corrections. Default is read-only preview.
 * node scripts/fix-seo-editorial.js [--apply]
 * No reseeding or deletion. An edited field must still match the audited version.
 */
const mongoose = require('mongoose');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const BlogPost = require('../models/BlogPost');
const patches = require('./seo-editorial-patches-2026-11-06.json');
const read = (doc, key) => key.split('.').reduce((value, part) => value?.[part], doc) ?? '';
async function run() {
 const apply = process.argv.includes('--apply');
 await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
 const changes = [];
 for (const patch of patches) {
  const doc = await BlogPost.findOne({ slug: patch.slug }).lean();
  if (!doc) throw new Error(`Missing article: ${patch.slug}`);
  const before = {}, after = {};
  for (const [key, field] of Object.entries(patch.fields)) {
   const current = read(doc, key);
   if (current === field.after) continue;
   if (current !== field.before) throw new Error(`Concurrent editorial change: ${patch.slug} / ${key}`);
   before[key] = current; after[key] = field.after;
  }
  if (Object.keys(after).length) {
   if (after['body.en']) {
    before.readTimeMinutes = doc.readTimeMinutes;
    after.readTimeMinutes = Math.max(1, Math.ceil(after['body.en'].split(/\s+/).length / 200));
   }
   changes.push({ id: doc._id, slug: patch.slug, before, after });
  }
 }
 console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', articles: changes.map(c => ({ slug: c.slug, fields: Object.keys(c.after) })) }, null, 2));
 if (!apply || !changes.length) return;
 // Save a rollback record before any write; fail if one already exists.
 const backup = path.join(__dirname, `seo-editorial-backup-${Date.now()}.json`);
 fs.writeFileSync(backup, JSON.stringify(changes, null, 2), { flag: 'wx', mode: 0o600 });
 for (const change of changes) {
  const result = await BlogPost.updateOne({ _id: change.id, ...change.before }, { $set: change.after }, { runValidators: true });
  if (result.matchedCount !== 1) throw new Error(`Article changed during apply: ${change.slug}; inspect backup before retrying`);
  const saved = await BlogPost.findById(change.id).lean();
  if (!Object.entries(change.after).every(([key, value]) => read(saved, key) === value)) throw new Error(`Verification failed: ${change.slug}`);
 }
 console.log(`Verified ${changes.length} updated articles. Rollback record: ${path.basename(backup)}`);
}
run().catch(error => { console.error(error.name === 'Error' && /^(Missing article|Concurrent editorial|Article changed|Verification failed)/.test(error.message) ? error.message : `Editorial migration failed (${error.name})`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
