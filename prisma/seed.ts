import { PrismaClient, EstadoServicio, Rol } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      nombre: faker.company.name(),
      correo: faker.internet.email(),
      nit: faker.string.numeric(10),
      numero: faker.phone.number(),
      pagina: faker.internet.url(),
    },
  });
  console.log(`Created Tenant: ${tenant.nombre}`);

  // 2. Create Empresa
  const empresa = await prisma.empresa.create({
    data: {
      nombre: faker.company.name(),
      tenantId: tenant.id,
    },
  });
  console.log(`Created Empresa: ${empresa.nombre}`);

  // 3. Create Zonas
  const zonasData = Array.from({ length: 5 }).map(() => ({
    nombre: faker.location.city(),
    tenantId: tenant.id,
    estado: true,
  }));
  await prisma.zona.createMany({ data: zonasData });
  const zonas = await prisma.zona.findMany({ where: { tenantId: tenant.id } });
  console.log(`Created ${zonas.length} Zonas`);

  // 4. Create MetodosPago
  const metodosData = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito'].map((nombre) => ({
    nombre,
    tenantId: tenant.id,
    activo: true,
  }));
  await prisma.metodoPago.createMany({ data: metodosData });
  const metodosPago = await prisma.metodoPago.findMany({ where: { tenantId: tenant.id } });
  console.log(`Created ${metodosPago.length} MetodosPago`);

  // 5. Create Servicios & TipoServicio
  const serviciosData = ['Fumigación General', 'Control de Roedores', 'Desinfección', 'Limpieza de Tanques'].map((nombre) => ({
    nombre,
    tenantId: tenant.id,
    empresaId: empresa.id,
    activo: true,
  }));
  await prisma.servicio.createMany({ data: serviciosData });
  const servicios = await prisma.servicio.findMany({ where: { tenantId: tenant.id } });

  const tiposServicioData = ['Residencial', 'Comercial', 'Industrial'].map((nombre) => ({
    nombre,
    tenantId: tenant.id,
    empresaId: empresa.id,
    activo: true,
  }));
  await prisma.tipoServicio.createMany({ data: tiposServicioData });
  const tiposServicio = await prisma.tipoServicio.findMany({ where: { tenantId: tenant.id } });

  // 6. Create Usuarios (Admin, Asesores, Tecnicos)
  // Admin
  await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      empresaId: empresa.id,
      nombre: 'Admin',
      apellido: 'User',
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123', // In a real app this should be hashed
      rol: Rol.ADMIN,
      activo: true,
    },
  });

  // Asesores
  const asesoresData = Array.from({ length: 3 }).map(() => ({
    tenantId: tenant.id,
    empresaId: empresa.id,
    nombre: faker.person.firstName(),
    apellido: faker.person.lastName(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'password123',
    rol: Rol.ASESOR,
    activo: true,
  }));
  // We use createMany for speed, but note that unique constraints (email/username) might collide rarely. 
  // For seed script using loops is safer or use createMany with skipDuplicates if supported (Postgres supports it).
  // Prisma createMany doesn't support returning IDs easily, so we fetch them after.
  for (const u of asesoresData) {
     await prisma.usuario.create({ data: u }).catch(e => console.error(`Error creating user ${u.email}:`, e));
  }
  
  // Tecnicos
  const tecnicosData = Array.from({ length: 5 }).map(() => ({
    tenantId: tenant.id,
    empresaId: empresa.id,
    nombre: faker.person.firstName(),
    apellido: faker.person.lastName(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: 'password123',
    rol: Rol.TECNICO,
    activo: true,
  }));
  for (const u of tecnicosData) {
     await prisma.usuario.create({ data: u }).catch(e => console.error(`Error creating user ${u.email}:`, e));
  }

  const usuarios = await prisma.usuario.findMany({ where: { tenantId: tenant.id } });
  const asesores = usuarios.filter(u => u.rol === Rol.ASESOR);
  const tecnicos = usuarios.filter(u => u.rol === Rol.TECNICO);
  console.log(`Created Users: 1 Admin, ${asesores.length} Asesores, ${tecnicos.length} Tecnicos`);

  // 7. Create Clientes & Direcciones
  const clientesCount = 20;
  console.log(`Creating ${clientesCount} Clientes with Direcciones...`);
  
  const clientes = [];
  for (let i = 0; i < clientesCount; i++) {
    const cliente = await prisma.cliente.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        nombre: faker.person.firstName(),
        apellido: faker.person.lastName(),
        telefono: faker.phone.number(),
        correo: faker.internet.email(),
        tipoDocumento: 'CC',
        numeroDocumento: faker.string.numeric(10),
        direcciones: {
          create: {
            tenantId: tenant.id,
            direccion: faker.location.streetAddress(),
            barrio: faker.location.street(),
            municipio: faker.location.city(),
          }
        }
      },
      include: { direcciones: true }
    });
    clientes.push(cliente);
  }

  // 8. Create OrdenServicio (The core for KPIs)
  // We want orders in different states and dates (past, current month, future)
  console.log('Creating OrdenServicio records...');
  const ordersCount = 100;
  
  for (let i = 0; i < ordersCount; i++) {
    const cliente = faker.helpers.arrayElement(clientes);
    const direccion = cliente.direcciones[0];
    const servicio = faker.helpers.arrayElement(servicios);
    const tipoServicio = faker.helpers.arrayElement(tiposServicio);
    const tecnico = faker.helpers.arrayElement(tecnicos);
    const asesor = faker.helpers.arrayElement(asesores);
    const zona = faker.helpers.arrayElement(zonas);
    const metodoPago = faker.helpers.arrayElement(metodosPago);
    const estado = faker.helpers.enumValue(EstadoServicio);
    
    // Generate dates distribution:
    // 40% past (last 6 months)
    // 40% current month
    // 20% future
    const dateCase = Math.random();
    let fechaVisita: Date;
    
    if (dateCase < 0.4) {
      fechaVisita = faker.date.past({ years: 0.5 });
    } else if (dateCase < 0.8) {
      fechaVisita = faker.date.recent({ days: 30 });
    } else {
      fechaVisita = faker.date.future({ years: 0.2 });
    }

    const valorCotizado = parseFloat(faker.commerce.price({ min: 50000, max: 500000 }));
    
    await prisma.ordenServicio.create({
      data: {
        tenantId: tenant.id,
        empresaId: empresa.id,
        clienteId: cliente.id,
        servicioId: servicio.id,
        tipoServicioId: tipoServicio.id,
        creadoPorId: asesor?.id, // Optional
        tecnicoId: estado !== EstadoServicio.SERVICIO_NUEVO ? tecnico?.id : null, // Only assign tech if processed
        direccionId: direccion.id,
        direccionTexto: direccion.direccion,
        barrio: direccion.barrio,
        municipio: direccion.municipio,
        estado: estado,
        fechaVisita: fechaVisita,
        horaInicio: fechaVisita,
        horaFin: new Date(fechaVisita.getTime() + 2 * 60 * 60 * 1000), // +2 hours
        valorCotizado: valorCotizado,
        valorPagado: estado === EstadoServicio.SERVICIO_LISTO ? valorCotizado : 0,
        metodoPagoId: metodoPago.id,
        zonaId: zona.id,
        observacion: faker.lorem.sentence(),
        createdAt: new Date(fechaVisita.getTime() - 2 * 24 * 60 * 60 * 1000), // Created 2 days before visit
      }
    });
  }

  console.log(`Created ${ordersCount} OrdenServicio records.`);
  console.log('✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
