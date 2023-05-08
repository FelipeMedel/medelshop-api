import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { fileNamer, fileFilter } from './helpers/'
import { Response } from 'express';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService,
    private readonly configService: ConfigService) {}

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
    ) {
    const path = this.filesService.getImageProduct(imageName)

    res.sendFile(path)

  }

  @Post('product')
  @UseInterceptors(FileInterceptor('file',
  {
    fileFilter: fileFilter,
    storage: diskStorage({
      destination: './images/products',
      filename: fileNamer
    })
  }))
  uploadImageFile(@UploadedFile() file: Express.Multer.File) {
    if ( !file ) {
      throw new BadRequestException('Make sure the file is an image');
    }

    const hostApi = this.configService.get('HOST')
    const portApi = this.configService.get('PORT')
    const apiName = this.configService.get('API_NAME')

    const secureUrl = `${hostApi}:${portApi}/${apiName}/files/product/${file.filename}`

    return {secureUrl}
  }
}
