import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { normalizeRoles } from '../auth/utils/normalize-roles';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';

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
    @InjectModel(UserRoleModel)
    private readonly userRoleModel: typeof UserRoleModel,
  ) {}

  private normalizeUserRoles(roles: unknown): string[] {
    return normalizeRoles(roles);
  }

  async findAll(params: FindAllUsersParams): Promise<PaginatedUsersResponse> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause: Record<string, unknown> | undefined = undefined;

    if (params.search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${params.search}%` } },
          { email: { [Op.like]: `%${params.search}%` } },
        ],
      };
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password_hash'] },
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    const normalizedUsers = rows.map((user) => {
      const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));
      (user as unknown as { role: string[] }).role = normalizedRoles;
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
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const normalizedRoles = normalizeRoles(user.user_roles?.map(ur => ur.role));
    (user as unknown as { role: string[] }).role = normalizedRoles;

    return user;
  }

  async updateRoles(id: number, roles: string[]): Promise<User> {
    const normalizedRoles = normalizeRoles(roles);

    await this.userRoleModel.destroy({ where: { user_id: id } });

    for (const role of normalizedRoles) {
      await this.userRoleModel.create({
        user_id: id,
        role,
      });
    }

    return this.findById(id);
  }

  async updateLocale(id: number, locale: string): Promise<User> {
    const user = await this.findById(id);

    await user.update({ locale });

    const updatedUser = await this.findById(id);
    return updatedUser;
  }

  async getPublicProfile(
    targetUserId: number,
    viewerRoles: string[],
  ): Promise<PublicUserProfileDto> {
    const targetUser = await this.userModel.findByPk(targetUserId, {
      include: [{ model: this.userRoleModel, as: 'user_roles' }],
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    const normalizedTargetRoles = this.normalizeUserRoles(
      targetUser.user_roles?.map((ur) => ur.role),
    );
    const normalizedViewerRoles = this.normalizeUserRoles(viewerRoles);

    const canViewAllProfiles =
      normalizedViewerRoles.includes('admin') ||
      normalizedViewerRoles.includes('author');

    if (!canViewAllProfiles && !normalizedTargetRoles.includes('author')) {
      throw new ForbiddenException('You can only view author profiles');
    }

    return {
      id: targetUser.id,
      name: targetUser.name,
      avatar_url: targetUser.avatar_url,
      description: targetUser.description,
      roles: normalizedTargetRoles,
      created_at: targetUser.created_at,
    };
  }
}


