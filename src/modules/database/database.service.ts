import { Injectable } from "@nestjs/common";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../../generated/prisma/client";
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DataBaseService extends PrismaClient {
    constructor(){
        const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
        super({adapter});
    }

    async onModuleInit(){
        await this.$connect();
    }
}