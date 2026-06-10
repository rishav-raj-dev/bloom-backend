import { IsArray, IsNotEmpty, IsString } from "class-validator"
import { ApplicableDays } from "./createHabit.dto"

export class UpdateHabitDto {
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    description: string

    @IsArray()
    @IsNotEmpty()
    applicableDays: ApplicableDays[]
}
