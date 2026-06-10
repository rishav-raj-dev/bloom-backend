import { Global, Module } from '@nestjs/common';
import { DataBaseService } from './database.service';
import { QueryService } from './query.service';

@Global()
@Module({
    providers: [DataBaseService, QueryService],
    exports: [DataBaseService, QueryService],
})
export class DatabaseModule{}