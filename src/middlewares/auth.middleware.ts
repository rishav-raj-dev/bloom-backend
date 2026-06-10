
import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService
    ){}
    async use(req: Request, res: Response, next: NextFunction){
        const cookieName: string = process.env.COOKIE_NAME || "bloom_access_token";
        const token = req['cookies'][cookieName] || this.extractFromHeader(req);
        if (!token){
            throw new BadRequestException("Access token is not available");
        }
        try{
            const payload = await this.jwtService.verifyAsync(token,{
                secret: process.env.JWT_SECRET
            });
            req['user'] = payload;
            next();
        }
        catch{
            throw new UnauthorizedException("User is not authorized");
        }
    }

    private extractFromHeader(req: Request){
        const headers = req.headers;
        const [type, token] = headers['authorization']?.split(' ') ?? [];
        return type=="Bearer"  ? token : undefined;
    }
}