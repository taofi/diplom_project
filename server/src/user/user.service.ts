import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User, UserRole } from '../db/models/user.model';

export interface FindAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedUsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  // Вспомогательная функция для нормализации ролей
  private normalizeRoles(roles: unknown): string[] {
    if (!roles) return [UserRole.USER];

    let roleArray: string[];

    if (Array.isArray(roles)) {
      roleArray = roles
        .map((r) => {
          if (typeof r === 'string') {
            if (r.includes(',')) {
              return r.split(',').map((item) => item.trim());
            }
            return r.trim();
          }
          return String(r);
        })
        .flat();
    } else if (typeof roles === 'string') {
      roleArray = roles.split(',').map((r) => r.trim());
    } else {
      roleArray = [UserRole.USER];
    }

    return [...new Set(roleArray.filter((r) => r))];
  }

  async findAll(params: FindAllUsersParams): Promise<PaginatedUsersResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause: { name?: Record<string, string>; email?: Record<string, string> } | undefined = undefined;

    if (params.search) {
      whereClause = {
        name: { [Op.like]: `%${params.search}%` },
        email: { [Op.like]: `%${params.search}%` },
      };
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password_hash'] },
    });

    // Нормализуем роли для каждого пользователя
    const normalizedUsers = rows.map((user) => {
      const normalizedRoles = this.normalizeRoles(user.role);
      user.role = normalizedRoles as UserRole[];
      return user;
    });

    return {
      data: normalizedUsers,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Нормализуем роли
    const normalizedRoles = this.normalizeRoles(user.role);
    user.role = normalizedRoles as UserRole[];

    return user;
  }

  async updateRoles(id: number, roles: string[]): Promise<User> {
    const user = await this.findById(id);

    const normalizedRoles = this.normalizeRoles(roles);

    await user.update({ role: normalizedRoles as UserRole[] });

    // Возвращаем пользователя без пароля
    const updatedUser = await this.findById(id);
    return updatedUser;
  }

  async updateLocale(id: number, locale: string): Promise<User> {
    const user = await this.findById(id);

    await user.update({ locale });

    // Возвращаем пользователя без пароля
    const updatedUser = await this.findById(id);
    return updatedUser;
  }
}
