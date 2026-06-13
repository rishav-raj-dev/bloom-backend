import { Controller, Post, Get, Body, Headers, Req, Res} from '@nestjs/common';
import type {Request, Response} from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() data: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(data);
    res.cookie(
      process.env.COOKIE_NAME || "bloom_access_token",
      result.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      }
    );
    res.send({ 
      success: true,
      message: 'Logged in successfully.',
      user: result.user,
    });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(process.env.COOKIE_NAME || "bloom_access_token",{
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.send({
      success: true,
      message: 'Logged out successfully.'
    });
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
