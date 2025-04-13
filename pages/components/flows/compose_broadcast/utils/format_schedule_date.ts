import dayjs from 'dayjs'

export interface ScheduleDateTime {
  minute?: string
  hour?: string
  ampm?: string
  value?: Date
}

export function getTodayFormatted(): string {
  const today = new Date()

  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${today.getFullYear()}-${month}-${day}`
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

export function formatScheduleDateTime(schedule: ScheduleDateTime) {
  try {
    if (!schedule.value || !schedule.hour || !schedule.minute || !schedule.ampm) {
      return { format: '', date: new Date() }
    }

    // Convert 12-hour format to 24-hour format
    let hour = Number.parseInt(schedule.hour)
    if (schedule.ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12
    } else if (schedule.ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0
    }

    const [year, month, day] = schedule.value
      .toISOString()
      .split('-')
      .map((num) => Number.parseInt(num))
    const date = new Date(year, month - 1, day, hour, Number.parseInt(schedule.minute))

    // Validate date
    if (Number.isNaN(date.getTime())) {
      return {
        format: '',
        date: new Date(),
      }
    }

    // Format month
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const formattedMonth = months[date.getMonth()]

    // Format hour and minute
    const displayHour = date.getHours() % 12 || 12
    const displayMinute = date.getMinutes().toString().padStart(2, '0')
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM'

    // Format day with padding
    const formattedDay = date.getDate().toString().padStart(2, '0')

    // Format to desired output
    return {
      date,
      format: `${formattedMonth} ${formattedDay}, ${date.getFullYear()}, ${displayHour}:${displayMinute} ${ampm}`,
    }
  } catch (error) {
    return {
      format: '',
      date: new Date(),
    }
  }
}
