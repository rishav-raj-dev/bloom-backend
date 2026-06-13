import { DataBaseService } from "./database.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ApplicableDays } from "src/modules/habit/dto/createHabit.dto";

function getUTCDayBounds(dateStr: string): { start: Date; end: Date } {
    const start = new Date(dateStr + 'T00:00:00.000Z');
    return { start, end: new Date(start.getTime() + 86400000) };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayOfWeek(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

@Injectable()
export class QueryService{
    constructor(
        private readonly db: DataBaseService
    ){}

    async findUser(user_email: string){
        const user = await this.db.$queryRaw<any[]>`
            SELECT user_id, user_name, user_email, password
            FROM "User"
            WHERE "User".user_email = ${user_email}
            LIMIT 1
        `;
        return user;
    }

    async createUser(user_name: string, user_email: string, hashedPassword: string){
        const user = await this.db.user.create({
            data: { user_name, user_email, password: hashedPassword },
            select: { user_id: true, user_name: true, user_email: true, password: true }
        });
        return user;
    }

    async createHabit(user_id: string, title: string, description: string, applicableDays: ApplicableDays[]) {
        const habit = await this.db.habit.create({
            data: {
                habit_title: title,
                habit_description: description,
                user_id,
                habit_applicable_days: {
                    create: applicableDays.map(d => ({ day: d.day, description: d.description || '' }))
                }
            },
            select: {
                habit_id: true,
                habit_title: true,
                habit_description: true,
                habit_applicable_days: true
            }
        });
        return habit;
    }

    async updateHabit(habit_id: string, title: string, description: string, applicableDays: ApplicableDays[]) {
        await this.db.habitDay.deleteMany({ where: { habit_id } });
        const habit = await this.db.habit.update({
            where: { habit_id },
            data: {
                habit_title: title,
                habit_description: description,
                habit_applicable_days: {
                    create: applicableDays.map(d => ({ day: d.day, description: d.description || '' }))
                }
            },
            select: {
                habit_id: true,
                habit_title: true,
                habit_description: true,
                habit_applicable_days: true
            }
        });
        return habit;
    }

    async addOrUpdateActivity(habit_id: string, is_completed: boolean, clientDate: string) {
        const habit = await this.db.habit.findFirst({ where: { habit_id } });
        if (!habit) throw new BadRequestException("Habit doesn't exist");

        const { start, end } = getUTCDayBounds(clientDate);

        await this.db.activityDay.deleteMany({
            where: { habit_id, current_date: { gte: start, lt: end } }
        });

        if (is_completed) {
            return this.db.activityDay.create({
                data: { habit_id, current_date: start }
            });
        }

        return null;
    }

    async deleteHabit(habit_id: string) {
        return await this.db.habit.delete({ where: { habit_id } });
    }

    async getAnalytics(user_id: string, currentDate: string) {
        const [year, month, day] = currentDate.split('-').map(Number);

        const last30: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.UTC(year, month - 1, day - i));
            last30.push(d.toISOString().slice(0, 10));
        }

        const rangeStart = new Date(last30[0] + 'T00:00:00.000Z');
        const rangeEnd = new Date(currentDate + 'T00:00:00.000Z');
        rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

        const habits = await this.db.habit.findMany({
            where: { user_id },
            include: {
                habit_applicable_days: true,
                activity_days: {
                    where: { current_date: { gte: rangeStart, lt: rangeEnd } }
                }
            }
        });

        return last30.map(dateStr => {
            const dayOfWeek = getDayOfWeek(dateStr);
            const { start, end } = getUTCDayBounds(dateStr);
            const applicable = habits.filter(h =>
                h.habit_applicable_days.some(d => d.day === dayOfWeek)
            );
            const total = applicable.length;
            const completed = applicable.filter(h =>
                h.activity_days.some(a => {
                    const t = new Date(a.current_date).getTime();
                    return t >= start.getTime() && t < end.getTime();
                })
            ).length;
            return {
                date: dateStr,
                total,
                completed,
                pct: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
        });
    }

    async getTodayHabits(user_id: string, clientDate: string) {
        const dayOfWeek = getDayOfWeek(clientDate);
        const [year, month, day] = clientDate.split('-').map(Number);

        const last7: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.UTC(year, month - 1, day - i));
            last7.push(d.toISOString().slice(0, 10));
        }

        const rangeStart = new Date(last7[0] + 'T00:00:00.000Z');
        const rangeEnd = new Date(clientDate + 'T00:00:00.000Z');
        rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

        const habits = await this.db.habit.findMany({
            where: {
                user_id,
                habit_applicable_days: { some: { day: dayOfWeek } }
            },
            include: {
                habit_applicable_days: true,
                activity_days: {
                    where: { current_date: { gte: rangeStart, lt: rangeEnd } }
                }
            }
        });

        return { habits, dates: last7 };
    }
}
