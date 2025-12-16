import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Intentar borrar la cookie 'token' si existe (para soporte futuro o híbrido)
    (await cookies()).delete("token");

    return NextResponse.json(
      { message: "Sesión cerrada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json(
      { message: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}
