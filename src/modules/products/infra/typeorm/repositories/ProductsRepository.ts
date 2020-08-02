import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);
    const validProducts = await this.ormRepository.find({
      id: In(productsIds),
    });

    products.map(product => {
      const checkProduct = validProducts.find(item => item.id === product.id);

      if (!checkProduct) {
        throw new AppError(`Invalid Product: ${product.id}`);
      }

      return product;
    });

    return validProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = products.map(product => product.id);
    const actualProducts = await this.ormRepository.find({
      id: In(productsIds),
    });

    const updatedProducts = actualProducts.map(product => {
      const orderQuantity = products.find(item => item.id === product.id);
      if ((orderQuantity?.quantity || 0) > product.quantity) {
        throw new AppError(
          `Insuficient quantity for Product: ${orderQuantity?.id}`,
        );
      }
      return {
        ...product,
        quantity: product.quantity - (orderQuantity?.quantity || 0),
      };
    });

    await this.ormRepository.save(updatedProducts);
    return updatedProducts;
  }
}

export default ProductsRepository;
