import { unknown, type z } from 'zod';

import { HttpError } from '../errors/http-errors.js';

export const validate = <Output>(schema: z.ZodType<Output>, data: unknown): Output =>{
    const result = schema.safeParse(data);

    if(!result.success){
        throw new HttpError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message);
    }

    return result.data;
}