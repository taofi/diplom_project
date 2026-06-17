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

  
  async getFileInfo(userId: number, userProductId: number): Promise<FileDownloadInfo | null> {
    const userProduct = await this.getUserProductById(userId, userProductId);

    if (!userProduct) {
      return null;
    }

    const productLicense = userProduct.product_license as ProductLicense & {
      product: Product;
    };

    if (!productLicense || !productLicense.product) {
      return null;
    }

    const product = productLicense.product;
    const fileUrl = product.file_url;

    if (!fileUrl) {
      return null;
    }

    try {
      const { filename, mimeType } = this.fileService.getFileStream(fileUrl);
      return { filename, mimeType };
    } catch {
      return null;
    }
  }

  
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

    const results: UserProductResponse[] = [];

    for (const up of userProducts) {
      const productLicense = up.product_license as ProductLicense & {
        product: Product;
        license_type: LicenseType;
      };
      const product = productLicense.product;
      const licenseType = productLicense.license_type;

      const productTranslation = await this.translationService.getProductTranslation(
        product.id,
        locale,
      );
      const licenseTypeTranslation = await this.translationService.getLicenseTypeTranslation(
        licenseType.id,
        locale,
      );

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
        sellerId: product.seller_id,
        count: up.count || 1,
      });
    }

    return results;
  }

  
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

  
  async downloadProduct(userId: number, userProductId: number): Promise<StreamableFile> {
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

    if (!this.fileService.fileExists(fileUrl)) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    const fullPath = this.fileService.getFullPath(fileUrl);
    if (!fullPath) {
      throw new NotFoundException(`File not found: ${fileUrl}`);
    }
    
    const readStream = createReadStream(fullPath);
    return new StreamableFile(readStream);
  }

  
  async addOrUpdateUserProduct(
    userId: number,
    productLicenseId: number,
    orderId: number,
    quantity: number,
  ): Promise<UserProduct> {
    const existingUserProduct = await this.userProductModel.findOne({
      where: {
        user_id: userId,
        product_license_id: productLicenseId,
      },
    });

    if (existingUserProduct) {
      const newCount = (existingUserProduct.count || 1) + quantity;
      await existingUserProduct.update({ count: newCount, order_id: orderId });
      return existingUserProduct;
    }

    return this.userProductModel.create({
      user_id: userId,
      product_license_id: productLicenseId,
      order_id: orderId,
      purchased_at: new Date(),
      count: quantity,
    });
  }
}


