import {
  type InferInput,
  maxLength,
  minLength,
  nonEmpty,
  objectAsync,
  pipe,
  string,
} from "valibot"

export const SetUserNameSchema = objectAsync({
  firstName: pipe(
    string(),
    nonEmpty("Please provide your first name"),
    maxLength(50, "First name must be less than 50 characters"),
  ),
  lastName: pipe(
    string(),
    nonEmpty("Please provide your last name"),
    maxLength(50, "Last name must be less than 50 characters"),
  ),
  teamName: pipe(
    string(),
    nonEmpty("Please provide your organisation name"),
    maxLength(50, "Organisation name must be less than 50 characters"),
  ),
})

export type SetUserNameDto = InferInput<typeof SetUserNameSchema>
