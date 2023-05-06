import { join } from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';

@Injectable()
export class FilesService {

    getImageProduct(imageName: string) {
        const path = join(__dirname, '../../images/products', imageName)

        if (!existsSync(path)) {
            throw new BadRequestException(`no product found with image ${imageName}`)
        }

        return path
    }

}
