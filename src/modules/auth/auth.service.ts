import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRow } from 'src/utils/types';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService
    ){}

    async login(data: {user_email: string, password: string}) {
        // find the user by email
        const users: UserRow[] = await this.usersService.getUserByEmail(data.user_email);
        // if the user does not exist, throw an error
        if (users.length === 0) {
            throw new BadRequestException(`No user exists with email: ${data.user_email}`);
        }
        // validate the password
        const userPassword = await this.usersService.getUserPassword(data.user_email);
        if (!(await bcrypt.compare(data.password, userPassword))) {
            throw new BadRequestException("Invalid Password");
        }
        // generate a JWT token
        const {token, payload} = await this.signJwtToken(users[0]);
        return { token, user: payload };
    }

    async register(data: { user_name: string, user_email: string, password: string }): Promise<UserRow> {
        // validate the password strength
        this.validatePasswordRequirement(data.password);

        // create a new user
        const { user_id, user_name, user_email } = await this.usersService.createUser({user_name: data.user_name, user_email: data.user_email, password: data.password});

        return { user_id, user_name, user_email };
    }

    private async signJwtToken(user: UserRow){
        const payload = {
            user_id : user.user_id,
            user_email: user.user_email,
            user_name: user.user_name
        }
        return { payload, token: this.jwtService.sign(payload) };
    }

    private validatePasswordRequirement(password: string){
        if (password.length < 6) throw new BadRequestException("Password must be at least 6 characters long");
        if (!/[A-Z]/.test(password)) throw new BadRequestException("Password must contain at least one uppercase letter");
        if (!/[a-z]/.test(password)) throw new BadRequestException("Password must contain at least one lowercase letter");
        if (!/[0-9]/.test(password)) throw new BadRequestException("Password must contain at least one number");
        if (!/[^A-Za-z0-9]/.test(password)) throw new BadRequestException("Password must contain at least one special character");
    }

}
