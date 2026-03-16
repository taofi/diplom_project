/**
 * Базовые типы для всех сущностей
 * Содержит общие интерфейсы, используемые во всех доменах
 */

/**
 * Базовый интерфейс для всех сущностей с общими полями
 */
export interface EntityBase {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Тип для timestamps, создаваемых автоматически
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Опции для include в Sequelize
 */
export interface IncludeOptions {
  model: unknown;
  as?: string;
  attributes?: string[];
  where?: Record<string, unknown>;
  required?: boolean;
  include?: IncludeOptions[];
}

/**
 * Элемент сортировки [поле, направление]
 */
export type OrderItem = [string, 'ASC' | 'DESC'];

/**
 * Базовые опции для поиска в репозитории
 */
export interface FindOptions<T = unknown> {
  where?: Partial<T>;
  include?: IncludeOptions[];
  order?: OrderItem[];
  limit?: number;
  offset?: number;
  attributes?: string[];
}

/**
 * Результат findAndCountAll
 */
export interface FindAndCountResult<T> {
  rows: T[];
  count: number;
}
