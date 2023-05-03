import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common/exceptions'
import { Repository } from 'typeorm'
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const {images = [], ...productDetails} = createProductDto

      const newProduct = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({url: image}))
      })
      await this.productRepository.save(newProduct)
      return {...newProduct, images: images}
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

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: []
    })

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`)
    try {
      await this.productRepository.save(product)
    } catch(error){
      this.handleDBExceptions(error)
    }

    return product
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