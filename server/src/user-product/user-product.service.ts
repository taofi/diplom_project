import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { UserProduct } from '../db/models/user-product.model';
import { ProductLicense } from '../db/models/product-license.model';
import { Product } from '../db/models/product.model';
import { ProductTranslation } from '../db/models/product-translation.model';
import { LicenseType } from '../db/models/license-type.model';
import { LicenseTypeTranslation } from '../db/models/license-type-translation.model';
import { Order } from '../db/models/order.model';
import { UserProductResponse } from './dto/user-product.dto';
import { TranslationService } from '../translation/translation.service';
import { FileService } from '../common/services/file.service';

interface FileDownloadInfo {
  filename: string;
  mimeType: string;
}

@Injectable()
export class UserProductService {
  constructor(
    @InjectModel(UserProduct)
    private readonly userProductModel: typeof UserProduct,
    @InjectModel(ProductLicense)
    private readonly productLicenseModel: typeof ProductLicense,
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    @InjectModel(ProductTranslation)
    private readonly productTranslationModel: typeof ProductTranslation,
    @InjectModel(LicenseType)
    private readonly licenseTypeModel: typeof LicenseType,
    @InjectModel(LicenseTypeTranslation)
    private readonly licenseTypeTranslationModel: typeof LicenseTypeTranslation,
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    private readonly translationService: TranslationService,
    private readonly fileService: FileService,
  ) {}

  /**
   * Получить информацию о файле для скачивания
   */
  async getFileInfo(userId: number, userProductId: number): Promise<FileDownloadInfo | null> {
    const userProduct = await this.getUserProductById(userId, userProductId);

    if (!userProduct) {
      return null;
    }

    const productLicense = userProduct.product_license as ProductLicense & {
      product: Product;
    };
    const product = productLicense.product;
    const fileUrl = product.file_url;

    if (!fileUrl) {
      return null;
    }

    // Делегируем получение информации файла в FileService
    try {
      const { filename, mimeType } = this.fileService.getFileStream(fileUrl);
      return { filename, mimeType };
    } catch {
      return null;
    }
  }

  /**
   * Получить список купленных товаров пользователя
   */
  async getUserProducts(userId: number, locale: string = 'en'): Promise<UserProductResponse[]> {
    const userProducts = await this.userProductModel.findAll({
      where: { user_id: userId },
      include: [
        {
          model: ProductLicense,
          include: [
            { model: Product },
            { model: LicenseType },
          ],
        },
        { model: Order },
      ],
      order: [['purchased_at', 'DESC']],
    });

    // Трансформируем данные с учётом локали
    const results: UserProductResponse[] = [];

    for (const up of userProducts) {
      const productLicense = up.product_license as ProductLicense & {
        product: Product;
        license_type: LicenseType;
      };
      const product = productLicense.product;
      const licenseType = productLicense.license_type;

      // Получаем переводы
      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      const licenseTypeTranslation = await this.translationService.getLicenseTypeTranslation(
        licenseType.id,
        locale,
      );

      // Получаем главное изображение (is_cover = true)
      const productImage = await this.translationService.getProductCoverImage(product.id);

      results.push({
        id: up.id,
        productId: product.id,
        productName: productTranslation?.name || `Product #${product.id}`,
        productImage: productImage || product.main_image,
        licenseTypeId: licenseType.id,
        licenseTypeName: licenseTypeTranslation?.name || `License #${licenseType.id}`,
        price: Number(productLicense.price),
        purchasedAt: up.purchased_at || new Date(),
        fileUrl: product.file_url,
      });
    }

    return results;
  }

  /**
   * Получить конкретный купленный товар по ID
   */
  async getUserProductById(userId: number, userProductId: number): Promise<UserProduct | null> {
    return this.userProductModel.findOne({
      where: { id: userProductId, user_id: userId },
      include: [
        {
          model: ProductLicense,
          include: [Product, LicenseType],
        },
        { model: Order },
      ],
    });
  }

  /**
   * Скачать файл купленного товара
   */
  async downloadProduct(userId: number, userProductId: number): Promise<StreamableFile> {
    // Получаем запись о покупке, проверяя что она принадлежит пользователю
    const userProduct = await this.getUserProductById(userId, userProductId);

    if (!userProduct) {
      throw new NotFoundException('Product not found or not purchased');
    }

    const productLicense = userProduct.product_license as ProductLicense & {
      product: Product;
    };
    const product = productLicense.product;
    const fileUrl = product.file_url;

    if (!fileUrl) {
      throw new NotFoundException('File not available for this product');
    }

    // Делегируем получение потока файла в FileService
    // Сначала проверяем, что файл существует
    if (!this.fileService.fileExists(fileUrl)) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    // Получаем полный путь и создаём поток
    const fullPath = this.fileService.getFullPath(fileUrl);
    if (!fullPath) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    const readStream = createReadStream(fullPath);
    return new StreamableFile(readStream);
  }
}
