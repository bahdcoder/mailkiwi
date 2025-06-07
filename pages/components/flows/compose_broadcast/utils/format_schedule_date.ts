import dayjs from 'dayjs'

export interface ScheduleDateTime {
  minute?: string
  hour?: string
  ampm?: string
  value?: Date
}

export const SCHEDULED_DATE_READABLE_FORMAT = 'MMM Do, YYYY, hh:mm A'

export function scheduledDateTimeToDayJsInstance(
  schedule: ScheduleDateTime,
): dayjs.Dayjs {
  const defaultSchedule = {
    value: new Date(),
    hour: '12',
    minute: '00',
    ampm: 'AM',
    ...schedule,
  }

  const baseDate = dayjs(defaultSchedule.value)
  const hour = Number.parseInt(defaultSchedule.hour)

  let hour24 = hour

  if (defaultSchedule.ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour24 = hour + 12
  } else if (defaultSchedule.ampm.toUpperCase() === 'AM' && hour === 12) {
    hour24 = 0
  }

  return baseDate.hour(hour24).minute(Number.parseInt(defaultSchedule.minute))
}

export function parseISODateToFormattedScheduleDate(isoDate: string | Date) {
  const date = dayjs(isoDate)
  const hours = date.hour()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12

  return {
    ampm,
    hour: hour.toString().padStart(2, '0'),
    minute: date.format('mm'),
    value: date.toDate(),
  }
}
