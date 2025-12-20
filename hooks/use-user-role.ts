"use client";

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: number;
  username: string;
  role: "ADMIN" | "ASESOR" | "TECNICO";
  aprobado: boolean;
  exp: number;
}

export function useUserRole() {
  const [role, setRole] = useState<"ADMIN" | "ASESOR" | "TECNICO" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token:", error);
        setRole(null);
      }
    } else {
      setRole(null);
    }
    setLoading(false);
  }, []);

  return { role, loading };
}
