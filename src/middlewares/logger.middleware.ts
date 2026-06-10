import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export class LoggerMiddleware implements NestMiddleware{
    use (req: Request, res: Response, next: NextFunction){
        const IP = req.ip;
        const date = new Date();
        const method = req.method;
        const path = req.path;
        console.log(`[${date.toISOString()}] [${IP}] - ${method} - ${path}`);
        next();
    }
}