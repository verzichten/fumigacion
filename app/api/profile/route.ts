import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        tipoDocumento: true,
        numeroDocumento: true,
        rol: true,
        tenantId: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return NextResponse.json({ error: "Error al cargar el perfil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const formData = await req.json();
    const { username, email, nombre, apellido, telefono, tipoDocumento, numeroDocumento, password } = formData;

    if (!username || !email || !nombre || !apellido) {
        return NextResponse.json({ error: "Campos obligatorios faltantes" }, { status: 400 });
    }

    const dataToUpdate: any = {
        username,
        email,
        nombre,
        apellido,
        telefono,
        tipoDocumento,
        numeroDocumento,
    };
    
    if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        dataToUpdate.password = hashedPassword;
    }

    await prisma.usuario.update({
        where: { id: payload.userId },
        data: dataToUpdate
    });

    return NextResponse.json({ success: true, message: "Perfil actualizado exitosamente" });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target;
        if (target && target.includes('email')) {
             return NextResponse.json({ error: "El correo electrónico ya está en uso." }, { status: 409 });
        }
        if (target && target.includes('username')) {
             return NextResponse.json({ error: "El nombre de usuario ya está en uso." }, { status: 409 });
        }
        return NextResponse.json({ error: "El usuario, correo o documento ya existe." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
  }
}
