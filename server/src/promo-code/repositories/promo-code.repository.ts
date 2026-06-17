import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PromoCode, DiscountType } from '../../db/models/promo-code.model';
import { FindOptions, FindAndCountOptions } from 'sequelize';
import { Op } from 'sequelize';
import { CreatePromoCodeDto } from '../dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from '../dto/update-promo-code.dto';

interface PromoCodeQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: DiscountType;
  search?: string;
}

type PromoCodeWhereOptions = FindOptions['where'] & {
  is_active?: boolean;
  discount_type?: DiscountType;
  [Op.or]?: Array<{
    code?: { [Op.iLike]: string };
    description?: { [Op.iLike]: string };
  }>;
};

@Injectable()
export class PromoCodeRepository {
  constructor(
    @InjectModel(PromoCode)
    private readonly promoCodeModel: typeof PromoCode,
  ) {}

  async findAll(options?: FindOptions): Promise<PromoCode[]> {
    return this.promoCodeModel.findAll(options);
  }

  async findById(id: number, options?: FindOptions): Promise<PromoCode | null> {
    return this.promoCodeModel.findByPk(id, options);
  }

  async findByCode(
    code: string,
    options?: FindOptions,
  ): Promise<PromoCode | null> {
    return this.promoCodeModel.findOne({
      where: { code },
      ...options,
    });
  }

  async findAndCountAll(
    query: PromoCodeQuery = {},
  ): Promise<{ rows: PromoCode[]; count: number }> {
    const { page = 1, limit = 10, isActive, type, search } = query;
    const offset = (page - 1) * limit;

    const where: PromoCodeWhereOptions = {};

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (type) {
      where.discount_type = type;
    }

    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const options: FindAndCountOptions = {
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    };

    return this.promoCodeModel.findAndCountAll(options);
  }

  async create(data: CreatePromoCodeDto): Promise<PromoCode> {
    return this.promoCodeModel.create(data as any);
  }

  async update(id: number, data: UpdatePromoCodeDto): Promise<PromoCode> {
    const promoCode = await this.findById(id);
    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return promoCode.update(data as any);
  }

  async delete(id: number): Promise<void> {
    const promoCode = await this.findById(id);
    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    await promoCode.destroy();
  }
}


