import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting production seed...");

  const tenantNames = [
    "FUMIGACION Y S.TECNICO",
    "ABOGADOS",
    "PSICOLOGOS",
    "CONTADORES",
    "ENFERMERAS",
  ];

  for (const nombre of tenantNames) {
    const tenant = await prisma.tenant.create({
      data: {
        nombre,
      },
    });
    console.log(`Created Tenant: ${tenant.nombre} (ID: ${tenant.id})`);
  }

  console.log("🌱 Seeding Zones...");
  const zonaNames = [
    "Industrial",
    "Comercial",
    "Hogar",
    "Apartamento",
    "Finca",
    "Residencial",
    "Educativo",
    "Hospitalario",
  ];

  for (const nombre of zonaNames) {
    const zona = await prisma.zona.create({
      data: {
        tenantId: 1,
        nombre,
        estado: true,
      },
    });
    console.log(`Created Zona: ${zona.nombre} (ID: ${zona.id})`);
  }

  console.log("🌱 Seeding Servicios...");
  const servicioNames = [
    "A: CONTROL DE CUCARACHAS",
    "B: CONTROL DE ROEDORES",
    "C: CONTROL DE CHINCHES",
    "D: CONTROL DE INSECTOS VOLADOR",
    "E: CONTROL INTEGRADO DE PLAGAS",
    "F: CONTROL DE COMEJEN",
    "G: DESINFECCION",
    "H: OTROS",
    "VENTA DE INSUMOS",
    "RECOLECCION DE CADAVERES (ROEDORES)",
  ];

  for (const nombre of servicioNames) {
    const servicio = await prisma.servicio.create({
      data: {
        tenantId: 1,
        nombre,
        activo: true,
        empresaId: 1,
      },
    });
    console.log(`Created Servicio: ${servicio.nombre} (ID: ${servicio.id})`);
  }

  console.log("🌱 Seeding more Servicios for empresaId 2...");
  const servicioNamesEmpresa2 = [
    "LAVADORA CARGA FRONTAL",
    "LAVADORA CARGA SUPERIOR",
    "CALENTADOR",
    "NEVERA",
    "NEVECON",
    "FREIDORA",
    "HORNO",
    "TELEVISOR",
    "SECADORA",
    "CUBIERTA",
    "ESTUFA",
    "DISPENSADOR DE AGUA",
    "CAMARAS DE SEGURIDAD",
    "VENTILADOR",
    "MICROONDAS",
    "RADIO",
    "AIRE ACONDICIONADO",
    "CAFETERA",
    "PEDALERA GUITARRA",
    "LAVAPLATOS",
    "CONGELADOR",
    "PERSIANAS",
    "CAMPANA",
    "LAVADORA SECADORA",
    "LAMPARA",
    "VARIOS ELECTRODOMESTICOS",
    "OTROS",
  ];

  for (const nombre of servicioNamesEmpresa2) {
    const servicio = await prisma.servicio.create({
      data: {
        tenantId: 1,
        nombre,
        activo: true,
        empresaId: 2,
      },
    });
    console.log(`Created Servicio: ${servicio.nombre} (ID: ${servicio.id})`);
  }

  console.log("✅ Production seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
