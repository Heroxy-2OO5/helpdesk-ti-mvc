import { findActivePriorities, findActiveRoles, findActiveTicketStatuses, } from '../models/catalog.model.js';
import type { PriorityCatalogItem, RoleCatalogItem, TicketStatusCatalogItem, } from '../types/catalog.types.js';

export const getRolesCatalog = async (): Promise<
    RoleCatalogItem[]
> => findActiveRoles();

export const getPrioritiesCatalog = async (): Promise<
    PriorityCatalogItem[]
> => findActivePriorities();

export const getTicketStatusesCatalog = async (): Promise<
    TicketStatusCatalogItem[]
> => findActiveTicketStatuses();