import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User, UserRole } from '../../entities/user.entity';
import { Settings } from '../../entities/settings.entity';

config();

const ADMIN_PHONES = ['09014399845', '09126868504'];

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'store_db',
  entities: [User, Settings],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();

  // Admins
  const userRepo = dataSource.getRepository(User);
  for (const phone of ADMIN_PHONES) {
    const existing = await userRepo.findOne({ where: { phone } });
    if (!existing) {
      await userRepo.save(userRepo.create({ phone, role: UserRole.ADMIN }));
      console.log(`Admin created: ${phone}`);
    } else if (existing.role !== UserRole.ADMIN) {
      existing.role = UserRole.ADMIN;
      await userRepo.save(existing);
      console.log(`Admin promoted: ${phone}`);
    } else {
      console.log(`Admin already exists: ${phone}`);
    }
  }

  // Settings (single row)
  const settingsRepo = dataSource.getRepository(Settings);
  const existing = await settingsRepo.findOne({ where: { id: 1 } });
  if (!existing) {
    await settingsRepo.save(settingsRepo.create({ id: 1 }));
    console.log('Settings row created');
  } else {
    console.log('Settings row already exists');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
