import { Controller, Post, Get, Body, Headers, Req} from '@nestjs/common';
import type {Request} from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: LoginDto) {
    const result = await this.authService.login(data);
    return {
      success: true,
      message: 'Logged in successfully.',
      token: result.token,
      user: result.user,
    };
  }

  @Post('register')
  async register(@Body() data: CreateAuthDto) {
    const user = await this.authService.register(data);
    return {
      success: true,
      message: 'Registered successfully.',
      user: user
    };
  }

  @Get('verify')
  verify(@Req() req: Request) {
    return {
      success: true,
      message: "Token is valid.",
      user: req['user']
    };
  }
}
