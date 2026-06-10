import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateHabitDto } from "./dto/createHabit.dto";
import { UpdateHabitDto } from "./dto/updateHabit.dto";
import { QueryService } from"src/modules/database/query.service";

@Injectable()
export class HabitService {
    constructor(
        private readonly queryService: QueryService
    ){}
    async createHabit(createHabitDto: CreateHabitDto){
        const {user_id, title, description, applicableDays} = createHabitDto;
        if (!user_id || !title || !description || !applicableDays || applicableDays.length==0) {
            return new BadRequestException("Not enough information to create a habit.");
        }
        try{
            const Habit = await this.queryService.createHabit(user_id, title, description, applicableDays);
            return {
                succcess: true,
                message: `Habit created successfully`,
                Habit
            }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }

    }


    async addActivity(habit_id: string, is_completed: boolean, clientDate: string, timezone: string){
        try {
            const habit = await this.queryService.addOrUpdateActivity(habit_id, is_completed, clientDate, timezone);
            return {
                success: true,
                message: "Acitivity update successfully",
                habit
            }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }
    }

    async updateHabit(habit_id: string, dto: UpdateHabitDto){
        try {
            const habit = await this.queryService.updateHabit(habit_id, dto.title, dto.description, dto.applicableDays);
            return { success: true, message: "Habit updated successfully", habit }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }
    }

    async deleteHabit(habit_id: string){
        try {
            await this.queryService.deleteHabit(habit_id);
            return { success: true, message: "Habit deleted successfully" }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }
    }

    async getAnalytics(user_id: string, currentDate: string, timezone: string){
        try {
            const data = await this.queryService.getAnalytics(user_id, currentDate, timezone);
            return {
                success: true,
                message: "Analytics fetched successfully",
                data
            }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }
    }

    async getTodayHabits(user_id: string, clientDate: string, timezone: string){
        try {
            const data = await this.queryService.getTodayHabits(user_id, clientDate, timezone);
            return {
                success: true,
                message: "Today's habits fetched successfully",
                data
            }
        }
        catch(error: any){
            return new BadRequestException(error.message);
        }
    }
}
