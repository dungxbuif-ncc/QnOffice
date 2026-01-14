import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { SnakeNamingStrategy } from './src/common/database/snake-naming.strategy';

dotenv.config();

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    process.env.NODE_ENV === 'production'
      ? 'dist/modules/**/*.entity{.ts,.js}'
      : 'src/modules/**/*.entity{.ts,.js}',
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/migrations/*{.ts,.js}'
      : 'migrations/*{.ts,.js}',
  ],
});
