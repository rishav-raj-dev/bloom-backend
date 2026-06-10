import { Module } from "@nestjs/common";
import { QueryService } from "src/modules/database/query.service";
import { DataBaseService } from "../database/database.service";
import { HabitController } from "./habit.controller";
import { HabitService } from "./habit.service";

@Module({
    controllers: [HabitController],
    providers: [HabitService]
})
export class HabitModule{}