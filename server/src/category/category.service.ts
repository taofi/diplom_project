import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Category } from '../db/models/category.model';
import { CategoryTranslation } from '../db/models/category-translation.model';
import { ProductCategory } from '../db/models/product-category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { CategoryResponse } from '../types/category';

interface CategoryTranslationRaw {
  category_id: number;
  locale: string;
  name: string;
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(CategoryTranslation)
    private readonly translationModel: typeof CategoryTranslation,
    @InjectModel(ProductCategory)
    private readonly productCategoryModel: typeof ProductCategory,
  ) {}

  private get sequelize() {
    return this.categoryModel.sequelize!;
  }

  async findAll(language?: string): Promise<CategoryResponse[]> {
    // Always load ALL translations for admin panel, but filter by language for the main name field
    const categories = await this.categoryModel.findAll({
      include: [
        {
          model: CategoryTranslation,
          required: false,
        },
      ],
    });

    return categories.map((category) => this.formatCategory(category, language));
  }

  async findById(id: number, language?: string): Promise<CategoryResponse> {
    const category = await this.categoryModel.findByPk(id, {
      include: [
        {
          model: CategoryTranslation,
          where: language ? { locale: language } : undefined,
          required: false,
        },
      ],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.formatCategory(category, language);
  }

  async findBySlug(slug: string, language?: string): Promise<CategoryResponse> {
    // First find the category by translations
    const translation = await this.translationModel.findOne({
      where: { name: slug },
      include: [{ model: Category }],
    });

    if (!translation) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return this.findById(translation.category_id, language);
  }

  async create(createCategoryDto: CreateCategoryDto, language: string = 'ru'): Promise<CategoryResponse> {
    const category = await this.categoryModel.create();

    // Create translation
    await this.translationModel.create({
      category_id: category.id,
      locale: language,
      name: createCategoryDto.name,
    });

    return this.findById(category.id, language);
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    language: string = 'ru',
  ): Promise<CategoryResponse> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update or create translation
    const existingTranslation = await this.translationModel.findOne({
      where: { category_id: id, locale: language },
    });

    if (existingTranslation && updateCategoryDto.name) {
      await existingTranslation.update({ name: updateCategoryDto.name });
    } else if (updateCategoryDto.name) {
      await this.translationModel.create({
        category_id: id,
        locale: language,
        name: updateCategoryDto.name,
      });
    }

    return this.findById(id, language);
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Delete all translations
    await this.translationModel.destroy({ where: { category_id: id } });

    // Delete all product-category relations
    await this.productCategoryModel.destroy({ where: { category_id: id } });

    // Delete category
    await category.destroy();
  }

  async getProductsCount(id: number): Promise<number> {
    const count = await this.productCategoryModel.count({
      where: { category_id: id },
    });
    return count;
  }

  async getProducts(id: number): Promise<number[]> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Get product IDs for this category
    const productCategories = await this.productCategoryModel.findAll({
      where: { category_id: id },
    });

    return productCategories.map((pc) => pc.product_id);
  }

  async addProduct(categoryId: number, productId: number): Promise<ProductCategory> {
    // Check if category exists
    const category = await this.categoryModel.findByPk(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check if relation already exists
    const existing = await this.productCategoryModel.findOne({
      where: { category_id: categoryId, product_id: productId },
    });

    if (existing) {
      return existing;
    }

    return this.productCategoryModel.create({
      category_id: categoryId,
      product_id: productId,
    });
  }

  async removeProduct(categoryId: number, productId: number): Promise<void> {
    const result = await this.productCategoryModel.destroy({
      where: { category_id: categoryId, product_id: productId },
    });

    if (result === 0) {
      throw new NotFoundException(
        `Product ${productId} not found in category ${categoryId}`,
      );
    }
  }

  private formatCategory(category: Category, language?: string): CategoryResponse {
    const result: CategoryResponse = {
      id: category.id,
      createdAt: category.created_at,
    };

    const translations = category.translations as CategoryTranslationRaw[] | undefined;

    if (translations && translations.length > 0) {
      const translation = language
        ? translations.find((t) => t.locale === language)
        : translations[0];

      if (translation) {
        result.name = translation.name;
      }
    }

    // Include all translations
    result.translations = translations?.map((t) => ({
      locale: t.locale,
      name: t.name,
    }));

    return result;
  }
}
