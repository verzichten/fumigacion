import Redis from 'ioredis';

// Pon aquí la URL directamente para probar (luego la borras)
const url = "redis://default:yosoyfeliz12@167.88.42.116:6379";

console.log("🔌 Conectando a Redis...");

const redis = new Redis(url, {
  connectTimeout: 5000,
});

redis.on('error', (err) => {
  console.error("❌ Error de conexión:", err.message);
  process.exit(1);
});

async function test() {
  try {
    await redis.set('test_key', 'Funciona!');
    const value = await redis.get('test_key');
    console.log("✅ ¡ÉXITO! Valor recuperado:", value);
  } catch (err) {
    console.error("❌ Falló la prueba:", err);
  } finally {
    redis.disconnect();
  }
}

test();
