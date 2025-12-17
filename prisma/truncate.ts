import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Truncating all tables...');

  try {
    // Lista de tablas basada en schema.prisma
    // Se usa comillas dobles para asegurar que PostgreSQL respete el casing si es necesario,
    // aunque Prisma suele usar el mismo nombre del modelo.
    const tables = [
      'Tenant',
      'Zona',
      'Empresa',
      'Usuario',
      'Cliente',
      'Direccion',
      'Servicio',
      'TipoServicio',
      'OrdenServicio',
      'Geolocalizacion',
      'MetodoPago',
    ];

    // Construir la consulta TRUNCATE
    // TRUNCATE TABLE "Table1", "Table2" RESTART IDENTITY CASCADE;
    const tableList = tables.map((t) => `"${t}"`).join(', ');
    const query = `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`;

    console.log(`Executing: ${query}`);

    await prisma.$executeRawUnsafe(query);

    console.log('All tables truncated successfully.');
  } catch (error) {
    console.error('Error truncating tables:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
