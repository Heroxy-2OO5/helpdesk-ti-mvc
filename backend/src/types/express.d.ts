import type { AuthenticatedUser } from './auth.types.ts';

declare global {
    namespace Express {
        interface Request {
            authUser?: AuthenticatedUser;
        }
    }
}

export{};