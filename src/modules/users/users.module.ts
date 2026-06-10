import { Module } from '@nestjs/common';
import { DataBaseService } from '../database/database.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// import { QueryController } from './query.controller'; // Uncomment if you have a controller

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
