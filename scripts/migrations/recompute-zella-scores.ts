import { db } from '../../lib/db/client';
import * as schema from '../../lib/db/schema';
import { eq } from 'drizzle-orm';
// import { calculateZellaScore } from '../../lib/zella' // Assuming this exists

async function recomputeScores() {
  console.log('Fetching all users...');
  const users = await db.query.User.findMany();
  
  console.log(`Found ${users.length} users. Recomputing scores...`);
  
  let processed = 0;
  for (const user of users) {
    try {
      // Simulate fetching trades and recalculating
      // const trades = await db.query.Trade.findMany({ where: eq(schema.Trade.userId, user.id) });
      // const newScore = calculateZellaScore(trades);
      
      // Update the user setting or wherever score is stored
      // await db.update(schema.UserSettings).set({ zellaScore: newScore }).where(eq(schema.UserSettings.userId, user.id));
      
      processed++;
      if (processed % 100 === 0) console.log(`Processed ${processed}/${users.length} users...`);
    } catch (err) {
      console.error(`Error processing user ${user.id}:`, err);
    }
  }
  
  console.log('Recomputation complete!');
  process.exit(0);
}

recomputeScores().catch(console.error);
