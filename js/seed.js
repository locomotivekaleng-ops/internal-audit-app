/* ============================================================
   SEED — Data already seeded via SQL migration
   This file is kept as a compatibility shim
   ============================================================ */

function seedDatabase() {
  if (DB.isInitialized()) return;
  // Data is loaded from Supabase via DB.init()
}

window.seedDatabase = seedDatabase;
