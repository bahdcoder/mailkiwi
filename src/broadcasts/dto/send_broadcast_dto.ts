import { makeDatabase } from "@/shared/container/index.js";
import { audiences } from "@/database/schema/schema.js";
import { isDateInPast } from "@/utils/dates.js";
import { eq } from "drizzle-orm";
import {
  type InferInput,
  boolean,
  check,
  checkAsync,
  date,
  email,
  maxLength,
  minLength,
  nonEmpty,
  nullable,
  number,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from "valibot";

export const SendBroadcastSchema = objectAsync({
  name: pipe(string(), nonEmpty(), minLength(8), maxLength(120)),

  audienceId: pipeAsync(
    string(),
    checkAsync(async (value) => {
      const database = makeDatabase();

      const audience = await database.query.audiences.findFirst({
        where: eq(audiences.id, value),
      });

      return audience !== undefined;
    }),
  ),

  trackClicks: optional(nullable(boolean())),
  trackOpens: optional(nullable(boolean())),

  emailContent: object({
    subject: pipe(string(), nonEmpty(), minLength(8), maxLength(120)),
    fromName: pipe(string(), nonEmpty()),
    fromEmail: pipe(string(), nonEmpty(), email()),
    replyToEmail: pipe(string(), nonEmpty(), email()),
    replyToName: pipe(string(), nonEmpty()),

    contentJson: nullable(optional(string())),
    contentText: pipe(string(), nonEmpty()),
    contentHtml: pipe(string(), nonEmpty()),

    previewText: nullable(optional(string())),
  }),

  sendAt: pipeAsync(
    nullable(optional(string())),
    check((input) => {
      if (!input) return true;
      const date = new Date(input);

      return !Number.isNaN(date.getTime());
    }),
  ),
});

export type SendBroadcastDto = InferInput<typeof SendBroadcastSchema>;
