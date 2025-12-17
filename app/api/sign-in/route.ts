import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario por username
    const user = await prisma.usuario.findUnique({
      where: { username },
    });

    // Si no existe o no está activo (opcional: no revelar cuál falló)
    if (!user) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    console.log("Login attempt:", { username: user.username, activo: user.activo, aprobado: user.aprobado });

    if (!user.activo) {
      return NextResponse.json(
        { message: "Cuenta inactiva. Contacte al administrador." },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Generar token
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.rol,
      aprobado: user.aprobado,
    });

    // Eliminar password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Inicio de sesión exitoso",
        token,
        user: userWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
