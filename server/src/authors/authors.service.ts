import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ProductService } from '../product/product.service';
import { normalizeRoles } from '../auth/utils/normalize-roles';
import { User } from '../db/models/user.model';
import { UserRole as UserRoleModel } from '../db/models/user-role.model';
import { GetAuthorsQueryDto } from './dto/get-authors-query.dto';
import type { AuthorListItemDto } from './dto/author-list-item.dto';
import type { ProductListItemResponse } from '../types/product/product-response.types';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(UserRoleModel)
    private readonly userRoleModel: typeof UserRoleModel,
    private readonly productService: ProductService,
  ) {}

  async findAll(query: GetAuthorsQueryDto): Promise<{
    data: AuthorListItemDto[];
    meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 5;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search?.trim()) {
      where.name = { [Op.iLike]: `%${query.search.trim()}%` };
    }

    const { count, rows } = await this.userModel.findAndCountAll({
      where,
      include: [
        {
          model: this.userRoleModel,
          as: 'user_roles',
          where: { role: 'author' },
          required: true,
          attributes: ['role'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      attributes: { exclude: ['password_hash'] },
    });

    const authorIds = rows.map((author) => author.id);
    const productsByAuthor = new Map<number, ProductListItemResponse[]>();

    if (authorIds.length > 0) {
      const desiredProductsPerAuthor = 5;
      const pendingAuthors = new Set(authorIds);
      const pageLimit = Math.max(limit * 10, 20);
      let productPage = 1;
      let hasNext = true;

      while (pendingAuthors.size > 0 && hasNext) {
        const productsResponse = await this.productService.findAll({
          page: productPage,
          limit: pageLimit,
          sellerIds: authorIds,
          sortBy: 'created_at',
          sortOrder: 'desc',
          language: query.language,
          isActive: true,
        });

        for (const product of productsResponse.data) {
          const current = productsByAuthor.get(product.sellerId) || [];
          if (current.length < desiredProductsPerAuthor) {
            current.push(product);
            productsByAuthor.set(product.sellerId, current);
          }
          if (current.length >= desiredProductsPerAuthor) {
            pendingAuthors.delete(product.sellerId);
          }
        }

        hasNext = productsResponse.meta.page < productsResponse.meta.totalPages;
        productPage += 1;
      }
    }

    const data: AuthorListItemDto[] = rows.map((author) => ({
      id: author.id,
      name: author.name,
      avatar_url: author.avatar_url,
      description: author.description,
      roles: normalizeRoles(author.user_roles?.map((role) => role.role)),
      latestProducts: productsByAuthor.get(author.id) || [],
    }));

    const totalPages = Math.ceil(count / limit) || 1;

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
      },
    };
  }
}

