import { BadGatewayException, BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from './dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

import * as bcrypt from 'bcrypt'
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  async create(createUserDto: CreateUserDto) {

    try {
      const {password, ...userData} = createUserDto
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      })
      await this.userRepository.save(user)
      delete user.password
      return user
    } catch (error) {
      this.handlerDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const {email, password} = loginUserDto

    const user = await this.userRepository.findOne({where: {email: email},
      select: {
        email: true,
        password: true,
        id: true
    }})

    if (!user) throw new UnauthorizedException('Credentials are not valid (email)')

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)')

    return {
      token: this.getJwtToken({id: user.id})
    }
  }

  async checkAuthStatus(token: string) {
    const dataToken = this.jwtService.decode(token, {json: true})

    const user = await this.userRepository.findOneBy({id: dataToken['id']})

    if (!user)
      throw new BadRequestException('Token not valid')

    return {
      ok: true,
      token,
      decode: dataToken,
      id: dataToken['id'],
      user: user
    }
  }

  async statusToken(user: User) {
    return {
      ...user,
      token: this.getJwtToken({id: user.id})
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload)
    return token
  }

  private handlerDBErrors(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail)
    }
    console.log(error);

    throw new InternalServerErrorException('please check server logs')
  }


}
