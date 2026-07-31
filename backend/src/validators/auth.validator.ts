import { z } from 'zod';

export const loginSchema = z.object({
    correo: z.string().trim().min(1, 'El correo es obligatorio').max(150, 'El correo no puede superar los 150 caracteres').email('El correo no tiene un formato válido').toLowerCase(),

    contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72, 'La contraseña no puede superar los 72 caracteres'),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;