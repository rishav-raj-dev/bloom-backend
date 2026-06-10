import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { HabitService } from "./habit.service";
import { CreateHabitDto } from "./dto/createHabit.dto";
import { UpdateHabitDto } from "./dto/updateHabit.dto";


@Controller('habit')
export class HabitController {
    constructor(
        private readonly habitService: HabitService
    ){}
    @Post()
    async createHabit(@Body() createHabitDto: CreateHabitDto){
        return await this.habitService.createHabit(createHabitDto);
    }

    @Get('today')
    async getTodayHabits(
        @Query('user_id') user_id: string,
        @Query('clientDate') clientDate: string,
        @Query('timezone') timezone: string,
    ){
        return await this.habitService.getTodayHabits(user_id, clientDate, timezone);
    }

    @Get('analytics')
    async getAnalytics(
        @Query('user_id') user_id: string,
        @Query('currentDate') currentDate: string,
        @Query('timezone') timezone: string,
    ){
        return await this.habitService.getAnalytics(user_id, currentDate, timezone);
    }

    @Patch(':habit_id')
    async updateHabit(@Param('habit_id') habit_id: string, @Body() updateHabitDto: UpdateHabitDto){
        return await this.habitService.updateHabit(habit_id, updateHabitDto);
    }

    @Delete(':habit_id')
    async deleteHabit(@Param('habit_id') habit_id: string){
        return await this.habitService.deleteHabit(habit_id);
    }

    @Post('activity/update')
    async addOrUpdateActivity(@Body() body: { habit_id: string; is_completed: boolean; clientDate: string; timezone: string }){
        return await this.habitService.addActivity(body.habit_id, body.is_completed, body.clientDate, body.timezone);
    }
}
