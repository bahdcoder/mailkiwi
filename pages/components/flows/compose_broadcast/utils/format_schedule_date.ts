export interface ScheduleDateTime {
  minute?: string
  hour?: string
  ampm?: string
  value?: string
}

export function formatScheduleDateTime(schedule: ScheduleDateTime) {
  try {
    if (!schedule.value || !schedule.hour || !schedule.minute || !schedule.ampm) {
      return { format: "", date: new Date() }
    }

    // Convert 12-hour format to 24-hour format
    let hour = parseInt(schedule.hour)
    if (schedule.ampm.toUpperCase() === "PM" && hour !== 12) {
      hour += 12
    } else if (schedule.ampm.toUpperCase() === "AM" && hour === 12) {
      hour = 0
    }

    // Create date object
    const [year, month, day] = schedule.value.split("-").map((num) => parseInt(num))
    const date = new Date(year, month - 1, day, hour, parseInt(schedule.minute))

    // Validate date
    if (isNaN(date.getTime())) {
      return {
        format: "",
        date: new Date(),
      }
    }

    // Format month
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const formattedMonth = months[date.getMonth()]

    // Format hour and minute
    const displayHour = date.getHours() % 12 || 12
    const displayMinute = date.getMinutes().toString().padStart(2, "0")
    const ampm = date.getHours() >= 12 ? "PM" : "AM"

    // Format day with padding
    const formattedDay = date.getDate().toString().padStart(2, "0")

    // Format to desired output
    return {
      date,
      format: `${formattedMonth} ${formattedDay}, ${date.getFullYear()}, ${displayHour}:${displayMinute} ${ampm}`,
    }
  } catch (error) {
    return {
      format: "",
      date: new Date(),
    }
  }
}
