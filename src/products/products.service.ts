import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common/exceptions'
import { DataSource, Repository } from 'typeorm'
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
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
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

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }))
  }

  async findOne(search: string) {
    let product: Product
    if (isUUID(search)) {
      product = await this.productRepository.findOneBy({id: search})
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod')
      product = await queryBuilder.where('upper(title) =:title or slug =:slug', {
        title: search.toUpperCase(),
        slug: search.toLowerCase()
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne()
    }
    if (!product) {
      throw new NotFoundException(`Product with ${search} not found!` )
    }

    return product
  }

  async findOnePlain(search: string) {
    const {images = [], ...product} = await this.findOne(search)
    return {...product, images: images.map(img => img.url)}
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const {images, ...dataUpdate} = updateProductDto

    const product = await this.productRepository.preload({
      id: id,
      ...dataUpdate
    })

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`)

    // create query runner
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {

      if(images) {
        await queryRunner.manager.delete(ProductImage, {product: {id: id}})
        product.images = images.map(image => this.productImageRepository.create({url: image}))
      }

      await queryRunner.manager.save(product)

      await queryRunner.commitTransaction()
      await queryRunner.release()

      return this.findOnePlain(id)

    } catch(error){
      await queryRunner.rollbackTransaction()
      await queryRunner.release()

      this.handleDBExceptions(error)
    }

  }

  async remove(id: string) {
    const product = await this.findOne(id)
    try{
      await this.productRepository.remove(product)
    } catch(error){
      this.handleDBExceptions(error)
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail)
    } else {
      this.logger.error(error)
      throw new InternalServerErrorException('Error no identificado, por favor revise los logs del servidor.')
    }
  }

  async deleteAllproducts(){
    const query = this.productRepository.createQueryBuilder('product')
    try {
      return await query
      .delete()
      .where({})
      .execute()
    } catch (error) {
      this.handleDBExceptions(error)
    }
  }

}