import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Headers, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { GetUser, GetHeaders, RoleProtected, Auth } from './decorators';
import { User } from './entities/user.entity';
import { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { ValidRoles } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('checkStatus/:token')
  checkAuthStatus(@Param('token') token: string) {
    return this.authService.checkAuthStatus(token);
  }

  @Get('statusToken')
  @Auth()
  refreshToken(
    @GetUser() user: User,
  ) {
    return this.authService.statusToken(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') email: string,
    @GetHeaders() rawHeaders: string[], // Decorador personalizado
    @Headers() headers: IncomingHttpHeaders // decorador de nestjs
  ) {

    return {
      ok: true,
      message: 'Testing private route',
      user: user,
      userEmail: email,
      rawHeaders: rawHeaders,
      headers: headers
    }
  }

  @Get('private/roles')
  @SetMetadata('roles', ['admin', 'supermaster'])
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute(
    @GetUser() user: User
  ){
    return {
      ok: true,
      user: user
    }
  }

  @Get('private/roles2')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRouteDecoratorCustom(
    @GetUser() user: User
  ){
    return {
      ok: true,
      user: user
    }
  }

  @Get('private/roles3')
  @Auth(ValidRoles.user)
  privateRouteDecoratorCustomSingle(
  ){
    return {
      ok: true,
      message: 'Entré'
    }
  }

}
