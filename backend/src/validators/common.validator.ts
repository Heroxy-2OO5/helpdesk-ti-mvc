import { z } from "zod";

export const idParamsSchema = z.object({
    id: z.string().regex(/^[1-9]\d*$/, 'El identificador no es valido',),
}).strict();

export const paginationFields = {
    page: z.coerce.number().int('La página debe ser un número entero').min(1,'La pagina debe ser mayor o igual a 1').default(1),

    limit: z.coerce.number().int('El limite debe ser un numero entero').min(1,'El miline debe ser mayor o igual a 1').max(100, 'El limite no puede superar 100 registros').default(20),
}