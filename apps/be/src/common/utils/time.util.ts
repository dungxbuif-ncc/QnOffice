/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { TZDate } from '@date-fns/tz';
import { APP_TIMEZONE } from '@src/common/constants';
import { format } from 'date-fns';
import { Between } from 'typeorm';

export const nowVn = (): Date => new TZDate(new Date(), APP_TIMEZONE);

export const toVnTime = (date: Date | string | number): Date =>
  new TZDate(new Date(date), APP_TIMEZONE);

export const startDayVn = (date: Date | string | number = new Date()): Date => {
  const d = new TZDate(new Date(date), APP_TIMEZONE);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endDayVn = (date: Date | string | number = new Date()): Date => {
  const d = new TZDate(new Date(date), APP_TIMEZONE);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const formatVn = (
  date: Date | string | number,
  formatStr = 'yyyy-MM-dd HH:mm:ss',
): string => {
  return format(toVnTime(date), formatStr);
};

export const formatDateVn = (date: Date | string | number): string => {
  return formatVn(date, 'yyyy-MM-dd');
};

export const vnLocalDateTime = (date: Date) =>
  `${toVnTime(date).toLocaleDateString()} ${toVnTime(date).toLocaleTimeString()}`;

export function withinVnDayTypeOrmQuery(
  date: Date | string | number = new Date(),
) {
  return Between(startDayVn(date), endDayVn(date));
}

export function checkMinuteFrom({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime: Date;
}): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

export const isWithinMinutes = (
  date1: Date,
  date2: Date,
  minutes = 30,
): boolean => {
  return (
    Math.abs(checkMinuteFrom({ startTime: date1, endTime: date2 })) <= minutes
  );
};
