
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, OneToMany, ManyToOne } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({name: 'products'})
export class  Product{

    @ApiProperty({
        description: 'Product ID',
        uniqueItems: true,
        example: '092aa074-8a16-4055-8586-25c9f60342ff'
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Product title',
        uniqueItems: true,
        example: 'T-shit Medel'
    })
    @Column('text', {unique: true})
    title: string;

    @ApiProperty({
        description: 'Product price',
        example: 0,
        default: 0
    })
    @Column('float', {default: 0})
    price: number;

    @ApiProperty({
        description: 'Product description',
        nullable: true,
        example: 'text description',
        default: null
    })
    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @ApiProperty({
        description: 'Product Slug - for CEO',
        uniqueItems: true,
        example: 'product_slug'
    })
    @Column('text', {unique: true})
    slug: string

    @ApiProperty({
        description: 'Product Stock',
        example: 0,
        default: 0
    })
    @Column('int', {default: 0})
    stock: number

    @ApiProperty({
        description: 'Product Sizes',
        example: ['Z', 'L', 'M'],
        default: [],
        isArray: true
    })
    @Column('text', {array: true})
    sizes: string[]

    @ApiProperty({
        description: 'Product Gender',
        example: 'boy'
    })
    @Column('text')
    gender: string

    @ApiProperty({
        description: 'Product Sizes',
        example: ['Z', 'L', 'M'],
        default: [],
        isArray: true
    })
    @Column('text', {
        array: true,
        default: []
    })
    tags: string[]

    @ApiProperty()
    @OneToMany(
        () => ProductImage,
        (productImage) => productImage.product,
        { cascade: true, eager: true }
    )
    images?: ProductImage[]

    @ManyToOne(
        () => User,
        (user) => user.produt,
        {eager: true}
    )
    user: User

    @BeforeInsert()
    checksSlugInsert(){
        if(!this.slug){
            this.slug = this.title
        }

        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }

    @BeforeUpdate()
    checksSlugUpdate(){
        if (this.title !== this.slug)
            this.slug = this.title

        this.slug = this.slug.toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }
}

