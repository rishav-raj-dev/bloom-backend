import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class UserCreateReq {
    @IsString()
    @IsNotEmpty()
    user_name: string;

    @IsEmail({}, { message: 'Please provide a valid email address' })
    user_email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
