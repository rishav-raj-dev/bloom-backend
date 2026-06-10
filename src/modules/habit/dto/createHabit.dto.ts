import { IsNotEmpty, IsString } from "class-validator";


export class ApplicableDays{
    @IsString()
    @IsNotEmpty()
    day: string

    @IsString()
    @IsNotEmpty()
    description: string
}

export class CreateHabitDto {
    @IsString()
    @IsNotEmpty()
    user_id : string

    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsNotEmpty()
    applicableDays: ApplicableDays[]
}