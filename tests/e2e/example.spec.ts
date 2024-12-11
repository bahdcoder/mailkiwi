import { test } from "@/tests/e2e/fixtures/users.js"

import { route } from "@/shared/routes/route_aliases.js"

test("owner has title", async ({ ownerPage }) => {
  await ownerPage.page.goto(route("auth_login"))
})

test("guest has title", async ({ guestPage }) => {
  await guestPage.page.goto(route("auth_login"))
})

test("author has title", async ({ authorPage }) => {
  await authorPage.page.goto(route("auth_login"))
})

test("manager has title", async ({ managerPage }) => {
  await managerPage.page.goto(route("auth_login"))
})

test("administrator has title", async ({ administratorPage }) => {
  await administratorPage.page.goto(route("auth_login"))
})
