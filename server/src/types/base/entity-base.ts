


export interface EntityBase {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}


export interface IncludeOptions {
  model: unknown;
  as?: string;
  attributes?: string[];
  where?: Record<string, unknown>;
  required?: boolean;
  include?: IncludeOptions[];
}


export type OrderItem = [string, 'ASC' | 'DESC'];


export interface FindOptions<T = unknown> {
  where?: Partial<T>;
  include?: IncludeOptions[];
  order?: OrderItem[];
  limit?: number;
  offset?: number;
  attributes?: string[];
}


export interface FindAndCountResult<T> {
  rows: T[];
  count: number;
}


