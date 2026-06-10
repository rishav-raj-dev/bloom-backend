
import { BadRequestException, Injectable } from "@nestjs/common";
import { DataBaseService } from "../database/database.service";
import { QueryService } from "src/modules/database/query.service";
import { UserCreateReq } from "./dto/UserCreateReq.dto";
import * as bcrypt from 'bcrypt';
import { UserRow } from "src/utils/types";

const HASH_SALT_ROUNDS: number = (() => {
    const raw = parseInt(process.env.HASH_SALT ?? '');
    return isNaN(raw) ? 10 : raw;
})();

@Injectable()
export class UsersService{
    constructor(
        private readonly queryService: QueryService
    ){}

    async createUser(userData: UserCreateReq): Promise<UserRow> {
        const {user_name, user_email, password} = userData;
        const user = await this.queryService.findUser(user_email);

        if (user.length > 0) {
            throw new BadRequestException(`An account already exists with ${user_email}`);
        }

        const hashedPassword = await bcrypt.hash(password, HASH_SALT_ROUNDS);

        const newUser: any = await this.queryService.createUser(user_name, user_email, hashedPassword);

        return {
            user_id: newUser.user_id,
            user_name: newUser.user_name,
            user_email: newUser.user_email
        }
    }
    async getUserPassword(user_email: string){
        const user: any = await this.queryService.findUser(user_email);
        if (user.length === 0) {
            throw new BadRequestException(`No user exists with email: ${user_email}`);
        }
        return user[0].password;
    }

    async getUserByEmail(user_email: string){
        const user = await this.queryService.findUser(user_email);
        return user;
    }
}