import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common/exceptions'
import { Repository } from 'typeorm'
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const newProduct = this.productRepository.create(createProductDto)
      await this.productRepository.save(newProduct)
      return newProduct
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }

  findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto
    return this.productRepository.find({
      take: limit,
      skip: offset
    });
  }

  async findOne(search: string) {
    let product: Product
    if (isUUID(search)) {
      product = await this.productRepository.findOneBy({id: search})
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder()
      product = await queryBuilder.where('upper(title) =:title or slug =:slug', {
        title: search.toUpperCase(),
        slug: search.toLowerCase()
      }).getOne()
    }
    if (!product) {
      throw new NotFoundException(`Product with ${search} not found!` )
    }
    return product
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    const product = await this.findOne(id)
    await this.productRepository.remove(product)
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail)
    } else {
      this.logger.error(error)
      throw new InternalServerErrorException('Error no identificado, por favor revise los logs del servidor.')
    }
  }

}