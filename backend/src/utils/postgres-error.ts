interface PostgresError {
    code: string;
    constraint?: string;
}

export const isPostgresError = (error: unknown): error is PostgresError =>(
    error instanceof Error && 'code' in error && typeof error.code === 'string'
);

export const hasPostgresCode = (error: unknown, code:string,):boolean => (
    isPostgresError(error) && error.code === code
);