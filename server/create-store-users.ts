import { hashPassword } from './auth';
import { storage } from './storage';

async function createStoreUsers() {
  const password = 'admin123';
  const hashedPassword = await hashPassword(password);

  const storeUsers = [
    { username: 'gol.fal', storeId: 2 },
    { username: 'gol.flm', storeId: 3 },
    { username: 'gol.leo', storeId: 4 },
    { username: 'gol.stu', storeId: 5 }
  ];

  for (const user of storeUsers) {
    try {
      await storage.createUser({
        username: user.username,
        password: hashedPassword,
        role: 'supermarket',
        storeId: user.storeId
      });
      console.log(`Created user ${user.username} for store ${user.storeId}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }
}

createStoreUsers().catch(console.error);