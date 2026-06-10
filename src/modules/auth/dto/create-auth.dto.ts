import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
    @IsString()
    @IsNotEmpty()
    user_name: string;

    @IsEmail()
    @IsNotEmpty()
    user_email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

}