import { DataBaseService } from "./database.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { UserRow } from "src/utils/types";
import { ApplicableDays } from "src/modules/habit/dto/createHabit.dto";

function getUTCBoundsForDate(dateStr: string, timezone: string): { start: Date; end: Date } {
    const [year, month, day] = dateStr.split('-').map(Number);
    const localMidnight = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
    localMidnight.setFullYear(year, month - 1, day);
    localMidnight.setHours(0, 0, 0, 0);

    const serverNow = new Date();
    const clientNow = new Date(serverNow.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = serverNow.getTime() - clientNow.getTime();

    const start = new Date(localMidnight.getTime() + offsetMs);
    const end = new Date(start.getTime() + 86400000);
    return { start, end };
}

function getDayOfWeekInTimezone(dateStr: string, timezone: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
}

function formatDateStr(d: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return parts;
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

    async createUser(user_name: string, user_email:string, hashedPassword: string){
        const user = await this.db.user.create(
            {
                data: {
                    user_name,
                    user_email,
                    password: hashedPassword
                },
                select: {
                    user_id: true,
                    user_name: true,
                    user_email: true,
                    password: true,
                }
            }
        )
        return user;
    }

    async createHabit(user_id: string, title: string, description: string, applicableDays: ApplicableDays[]) {
        const habit = await this.db.habit.create({
            data: {
                habit_title: title,
                habit_description: description,
                user_id,
                habit_applicable_days: {
                    create: applicableDays.map((applicableDay) => ({
                        day: applicableDay.day,
                        description: applicableDay.description || ''
                    }))
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

    async addOrUpdateActivity(habit_id: string, is_completed: boolean, clientDate: string, timezone: string) {
        const habit = await this.db.habit.findFirst({
            where: { habit_id }
        });
        if (!habit) {
            throw new BadRequestException("Habit doesn't exist");
        }

        const { start, end } = getUTCBoundsForDate(clientDate, timezone);

        let activity_days = await this.db.activityDay.findFirst({
            where: {
                habit_id: habit.habit_id,
                current_date: { gte: start, lt: end }
            }
        });

        if (activity_days) {
            activity_days = await this.db.activityDay.update({
                where: { activity_id: activity_days.activity_id },
                data: { completed: is_completed }
            });
        } else {
            activity_days = await this.db.activityDay.create({
                data: {
                    habit_id: habit.habit_id,
                    current_date: start,
                    completed: is_completed
                }
            });
        }

        return activity_days;
    }

    async deleteHabit(habit_id: string) {
        return await this.db.habit.delete({
            where: { habit_id }
        });
    }

    async getAnalytics(user_id: string, currentDate: string, timezone: string) {
        const [year, month, day] = currentDate.split('-').map(Number);

        const last30DateStrs: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(Date.UTC(year, month - 1, day - i, 12, 0, 0));
            last30DateStrs.push(formatDateStr(d, timezone));
        }

        const rangeStart = getUTCBoundsForDate(last30DateStrs[0], timezone).start;
        const rangeEnd = getUTCBoundsForDate(last30DateStrs[29], timezone).end;

        const habits = await this.db.habit.findMany({
            where: { user_id },
            include: {
                habit_applicable_days: true,
                activity_days: {
                    where: {
                        current_date: { gte: rangeStart, lt: rangeEnd }
                    }
                }
            }
        });

        return last30DateStrs.map(dateStr => {
            const dayOfWeek = getDayOfWeekInTimezone(dateStr, timezone);
            const { start, end } = getUTCBoundsForDate(dateStr, timezone);
            const applicableHabits = habits.filter(h =>
                h.habit_applicable_days.some(d => d.day === dayOfWeek)
            );
            const total = applicableHabits.length;
            const completed = applicableHabits.filter(h =>
                h.activity_days.some(a => {
                    const actTime = new Date(a.current_date).getTime();
                    return actTime >= start.getTime() && actTime < end.getTime() && a.completed;
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

    async getTodayHabits(user_id: string, clientDate: string, timezone: string) {
        const dayOfWeek = getDayOfWeekInTimezone(clientDate, timezone);

        const last7DateStrs: string[] = [];
        const [year, month, day] = clientDate.split('-').map(Number);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.UTC(year, month - 1, day - i, 12, 0, 0));
            last7DateStrs.push(formatDateStr(d, timezone));
        }

        const rangeStart = getUTCBoundsForDate(last7DateStrs[0], timezone).start;
        const rangeEnd = getUTCBoundsForDate(last7DateStrs[6], timezone).end;

        const habits = await this.db.habit.findMany({
            where: {
                user_id,
                habit_applicable_days: {
                    some: { day: dayOfWeek }
                }
            },
            include: {
                habit_applicable_days: true,
                activity_days: {
                    where: {
                        current_date: { gte: rangeStart, lt: rangeEnd }
                    }
                }
            }
        });

        return {
            habits,
            dates: last7DateStrs
        };
    }
    
}