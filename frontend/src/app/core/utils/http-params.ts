import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

export function buildHttpParams<T extends object>(values: T,): HttpParams {
    let params = new HttpParams();

    const entries = Object.entries(values) as Array<[string, QueryValue]>;

    for (const [key, value] of entries) {
        if (
            value === undefined ||
            value === null ||
            value === ''
        ) {
            continue;
        }

        params = params.set(key, String(value));
    }

    return params;
}