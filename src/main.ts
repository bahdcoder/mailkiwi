import "reflect-metadata"

import { Ignitor } from "@/infrastructure/boot/ignitor"

new Ignitor().boot().register().startHttpServer()
