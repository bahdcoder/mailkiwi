# Kibamail AI Agent Guidelines

This document provides comprehensive guidelines for AI agents working with the Kibamail codebase. Follow these instructions strictly to maintain code quality and consistency.

## Code Structure and Organization

### Modular Architecture

Kibamail follows a domain-driven, modular architecture with clear separation of concerns. The codebase is organized into distinct modules, each representing a specific domain or feature area.

#### Core Modules

The application is divided into these primary modules:

1. **App** (`core/app/`): Core application bootstrap and configuration
2. **Auth** (`core/auth/`): Authentication, user management, and sessions
3. **Audiences** (`core/audiences/`): Contact management and segmentation
4. **Broadcasts** (`core/broadcasts/`): Email campaign management
5. **Sending Domains** (`core/sending_domains/`): Domain configuration and verification
6. **Kumomta** (`core/kumomta/`): Mail Transfer Agent (MTA) integration
7. **Tracking** (`core/tracking/`): Email open and click tracking
8. **Injector** (`core/injector/`): Email injection and delivery
9. **Forms** (`core/forms/`): Form creation and management
10. **Automations** (`core/automations/`): Email automation workflows
11. **Teams** (`core/teams/`): Multi-tenant team management
12. **Media Library** (`core/media-library/`): Asset management
13. **Websites** (`core/websites/`): Landing page and website management
14. **Chat** (`core/chat/`): Community and support chat
15. **Worker** (`core/worker/`): Background job processing

#### Module Structure

Each module follows a consistent internal structure:

```
module/
├── actions/           # Business logic
├── controllers/       # HTTP request handlers
├── dto/               # Data Transfer Objects and validation
├── jobs/              # Background processing tasks
├── middleware/        # Module-specific middleware
├── repositories/      # Data access layer
└── tools/             # Utility functions specific to the module
```

#### Module Interaction

Modules interact through well-defined interfaces:

1. **Direct Dependencies**: Explicitly imported and injected
2. **Container Registry**: Services registered and resolved through the DI container
3. **Events**: Asynchronous communication between modules
4. **Jobs**: Background processing across module boundaries

### Project Architecture

The architecture follows these key principles:

- **Domain-Driven Design**: Code organized around business domains
- **Hexagonal Architecture**: Core business logic isolated from external concerns
- **CQRS Pattern**: Separation of command and query responsibilities
- **Repository Pattern**: Data access abstracted behind repositories
- **Dependency Injection**: Services resolved through a container

Key architectural components:

- **Controllers**: Handle HTTP requests and route to appropriate actions
- **Actions**: Contain business logic for specific operations
- **Repositories**: Handle data access and persistence
- **DTOs**: Define data transfer objects and validation schemas
- **Jobs**: Background processing tasks
- **Middleware**: Cross-cutting request processing

### File Organization

- Domain-driven organization with features in dedicated folders
- Consistent file naming using snake_case for files and PascalCase for classes
- Related functionality grouped together (e.g., controllers, actions, repositories)

## Coding Standards

### Class-Based Architecture

- **ALWAYS use classes** for implementing functionality
- Every controller, action, repository, and service should be a class
- Use dependency injection through constructor parameters
- Extend base classes where appropriate (BaseController, BaseRepository, etc.)

```typescript
export class ContactController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes([
      ['GET', '/', this.index.bind(this)],
      ['POST', '/', this.store.bind(this)],
    ], {
      prefix: 'audiences/:audienceId/contacts',
    })
  }

  async index(ctx: HonoContext) {
    // Implementation
  }
}
```

### Code Documentation

- **ONLY add comments to classes and methods, NEVER inline**
- Use JSDoc-style comments for all classes and public methods
- Document the purpose, parameters, and return values
- Include examples for complex functionality
- Focus on explaining "why" not "what" (code should be self-explanatory)

```typescript
/**
 * UserRepository manages user accounts and authentication operations.
 *
 * This repository is responsible for:
 * 1. User account creation and management
 * 2. Password hashing and verification
 * 3. Email verification processes
 * 4. OAuth account linking
 */
export class UserRepository extends BaseRepository {
  /**
   * Creates a new user with the provided email address.
   *
   * Generates a verification code and sends it to the user's email.
   * The user account is not active until the email is verified.
   */
  async create(payload: CreateUserDto) {
    // Implementation
  }
}
```

### Validation and Type Safety

- Use Valibot schemas for all data validation
- Define explicit DTOs for all input/output data
- Export type definitions derived from validation schemas
- Validate all user input at the controller level

```typescript
export const CreateUserSchema = objectAsync({
  email: pipe(
    string('Email must be a text value'),
    email('Please provide a valid email address'),
  ),
})

export type CreateUserDto = InferInput<typeof CreateUserSchema>
```

## Environment Configuration

### Environment Variables

- Access environment variables through the `appEnv` object
- Never use `process.env` directly
- Environment variables are loaded through the `env.mjs` script
- Different environments: dev, test, staging, prod, coder

```typescript
import { appEnv } from '#root/core/app/env/app_env.js'

// Correct
const apiUrl = appEnv.API_URL

// Incorrect - never do this
const apiUrl = process.env.API_URL
```

### Configuration Management

- Environment-specific configuration is managed through Infisical
- Local development uses `.env` files (not committed to repository)
- Production and staging use Infisical service tokens

## Database Operations

### Schema Definition

- Database schema is defined in `database/schema.ts`
- Use Drizzle ORM for database operations
- Define relationships explicitly using the relations API
- Document tables with JSDoc comments explaining their purpose

```typescript
/**
 * Contacts table - Core entity for audience management and email targeting.
 *
 * This table is the foundation of Kibamail's audience management system, storing
 * all recipient information and engagement metrics.
 */
export const contacts = mysqlTable('contacts', {
  id,
  email: varchar('email', { length: 255 }).notNull(),
  // Additional fields
})
```

### Repository Pattern

- All database access should go through repository classes
- Repositories should extend BaseRepository
- Use typed queries with Drizzle ORM
- Implement proper error handling and transaction support

```typescript
export class ContactRepository extends BaseRepository {
  async findById(id: string) {
    const [contact] = await this.database
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1)

    return contact
  }
}
```

## Controllers and Routing

### Routing System

Kibamail uses a custom routing system built on top of the Hono framework. The routing system has several key components:

1. **Route Definition**: Routes are defined as arrays with HTTP method, path, handler, and optional middleware
2. **Route Registration**: Routes are registered in controller constructors using `defineRoutes`
3. **Route Prefixes**: Routes can be grouped with common prefixes
4. **Route Aliases**: Common routes are defined as constants in `route_aliases.ts`
5. **Middleware**: Routes can have middleware applied at different levels

#### Route Definition Format

```typescript
// Format: [HTTP Method, Path, Handler Function, Optional Middleware Array]
['GET', '/', this.index.bind(this)]
['POST', '/users', this.store.bind(this), [someMiddleware]]
```

#### Route Registration

```typescript
this.app.defineRoutes(
  [
    ['GET', '/', this.index.bind(this)],
    ['POST', '/', this.store.bind(this)],
  ],
  {
    prefix: 'audiences/:audienceId/contacts', // Optional prefix
    middleware: [customMiddleware], // Optional middleware
  }
)
```

#### Route Aliases

```typescript
// Using predefined route aliases
import { route } from '#root/core/shared/routes/route_aliases.js'

this.app.defineRoutes([
  ['GET', route('dashboard'), this.dashboard.bind(this)],
  ['GET', route('auth_login'), this.login.bind(this)],
])
```

#### Vike Page Routes

For server-rendered pages using Vike:

```typescript
// Creates both the page route and the JSON data route
this.app.defineRoutes([
  ...this.vikePath('/dashboard', this.dashboard.bind(this))
])
```

### Controller Structure

- Controllers should extend BaseController or VikeController
- Define routes in the constructor using defineRoutes
- Use middleware for cross-cutting concerns
- Validate input using validation schemas

```typescript
export class AuthController extends BaseController {
  constructor(private app: HonoInstance = makeApp()) {
    super()

    this.app.defineRoutes([
      ['POST', '/login', this.login.bind(this)],
      ['POST', '/register', this.register.bind(this)],
    ])
  }

  async login(ctx: HonoContext) {
    const payload = await this.validate(ctx, LoginSchema)
    // Implementation
  }
}
```

### Middleware System

Middleware functions can be applied at different levels:

1. **Global Middleware**: Applied to all routes in `ignitor.ts`
2. **Route Group Middleware**: Applied to a group of routes in `defineRoutes`
3. **Route-Specific Middleware**: Applied to specific routes in the route definition

Common middleware is registered with aliases for easy use:

```typescript
// Using middleware aliases
import { middleware } from '#root/core/shared/middleware/middleware_aliases.js'

this.app.defineRoutes([
  ['GET', '/profile', this.profile.bind(this)],
], {
  middleware: [middleware('must_be_authenticated')],
})
```

### Action Pattern

- Business logic should be in dedicated action classes
- Actions should be single-purpose and focused
- Controllers should delegate to actions
- Actions should be testable in isolation

```typescript
export class LoginAction {
  constructor(private userRepository = container.make(UserRepository)) {}

  async handle(payload: LoginDto) {
    // Implementation
  }
}
```

## Testing

### Test Organization

- Unit tests for individual components
- Integration tests for API endpoints
- E2E tests for critical user flows
- Tests are run with Vitest

### Common Test Commands

- `pnpm test` - Run all tests
- `pnpm test:server` - Run server tests
- `pnpm test:client` - Run client tests
- `pnpm test:e2e` - Run end-to-end tests

## Development Workflow

### Common Commands

- `pnpm dev` - Start development server and worker
- `pnpm build` - Build the application
- `pnpm mysql:migrate` - Run database migrations
- `pnpm cli` - Run CLI commands
- `pnpm coder:dev` - Start development environment for Coder

### Docker Development

- Development environment uses Docker Compose
- Services defined in docker/compose.*.yaml files
- Main services: app, mysql, redis, kumomta, mailpit

## Deployment

- Zero-downtime deployment with git-based rollbacks
- Deployments are managed through Ansible
- PM2 is used for process management
- Separate deployments for app and worker processes

## Additional Guidelines

1. **NEVER use inline comments** - Comments should only be on classes and methods
2. **Default to classes** whenever implementing functionality
3. **Use dependency injection** for all dependencies
4. **Validate all input** at the controller level
5. **Write modular, single-purpose code**
6. **Follow the established patterns** in the codebase
7. **Document public APIs** with JSDoc comments
8. **Use typed interfaces** for all data structures
9. **Handle errors appropriately** at each level
10. **Write tests** for all new functionality

By following these guidelines, you'll maintain the high quality and consistency of the Kibamail codebase.

## Implementation Best Practices

### Error Handling

- Use try/catch blocks for error handling
- Return appropriate HTTP status codes from controllers
- Log errors with the logger service
- Provide user-friendly error messages

```typescript
try {
  const result = await this.action.handle(payload)
  return ctx.json(result)
} catch (error) {
  this.logger.error(error)
  return ctx.json({ error: 'An unexpected error occurred' }, 500)
}
```

### Dependency Injection

- Use the container for dependency injection
- Register services in the container during application boot
- Inject dependencies through constructor parameters
- Allow overriding dependencies for testing

```typescript
constructor(
  private userRepository = container.make(UserRepository),
  private logger = container.make(ContainerKey.logger)
) {}
```

### Asynchronous Operations

- Use async/await for asynchronous code
- Avoid callback patterns
- Handle promise rejections properly
- Use Promise.all for parallel operations

### Security Considerations

- Validate and sanitize all user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Use HTTPS for all communications

## Common Pitfalls to Avoid

1. **Avoid direct database access** outside of repositories
2. **Don't use process.env directly** - use appEnv instead
3. **Never commit sensitive information** to the repository
4. **Don't use inline comments** - they clutter the code
5. **Avoid complex nested conditionals** - extract to methods
6. **Don't duplicate code** - use shared utilities
7. **Avoid large classes** - split into smaller, focused classes
8. **Don't ignore TypeScript errors** - fix them properly
9. **Avoid any type** - use proper typing
10. **Don't skip writing tests** - they ensure code quality

## Special Instructions for AI Agents

As an AI agent working with the Kibamail codebase, you must adhere to these additional guidelines:

### Before Making Changes

1. **Thoroughly analyze the codebase** to understand existing patterns
2. **Identify similar implementations** before creating new ones
3. **Review the database schema** to understand data relationships
4. **Check for existing utilities** before creating new ones
5. **Understand the domain context** before implementing solutions

### When Implementing Solutions

1. **Follow existing patterns** exactly as they appear in the codebase
2. **Maintain consistent naming conventions**:
   - Controllers: `FooController`
   - Actions: `CreateFooAction`, `UpdateFooAction`, etc.
   - Repositories: `FooRepository`
   - DTOs: `CreateFooDto`, `UpdateFooDto`, etc.
   - Schemas: `CreateFooSchema`, `UpdateFooSchema`, etc.
3. **Implement proper validation** using Valibot schemas
4. **Use dependency injection** for all dependencies
5. **Write comprehensive class and method documentation**
6. **NEVER add inline comments** - document at class and method level only
7. **Create focused, single-responsibility classes**
8. **Implement proper error handling**
9. **Follow the controller-action-repository pattern**
10. **Use typed interfaces** for all data structures

### When Suggesting Changes

1. **Explain the rationale** behind your suggested changes
2. **Reference existing patterns** in the codebase
3. **Highlight potential impacts** on other parts of the system
4. **Suggest tests** to validate the changes
5. **Consider performance implications**

By following these guidelines, you'll ensure that your contributions maintain the high quality and consistency of the Kibamail codebase while adhering to the established architectural patterns and coding standards.

## Services and Tools Reference

Kibamail uses a variety of services, tools, and libraries. This section provides a comprehensive reference of the key technologies used in the project.

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥ 22.4.0 | JavaScript runtime |
| TypeScript | Latest | Type-safe JavaScript |
| Hono | 4.5.0+ | Web framework |
| Vike | 0.4.198+ | Server-side rendering |
| React | Latest | UI library |
| Drizzle ORM | Latest | Database ORM |
| MySQL | 8.0+ | Primary database |
| Redis/DragonflyDB | Latest | Caching and queues |
| BullMQ | 5.12.10+ | Job queue |
| KumoMTA | Latest | Mail Transfer Agent |
| Pino | 9.5.0+ | Logging |
| Valibot | 0.36.0+ | Validation |

### Infrastructure and Deployment

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development |
| Terraform | Infrastructure as code |
| Hetzner Cloud | Cloud provider |
| Ansible | Configuration management |
| PM2 | Process management |
| Infisical | Secrets management |
| GitHub Actions | CI/CD |

### Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| Vitest | Testing framework |
| Playwright | End-to-end testing |
| Biome | Linting and formatting |
| Husky | Git hooks |
| Mailpit | Email testing |

### Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| @aws-sdk | 3.741.0+ | S3 file storage |
| @bull-board | 6.7.9+ | Queue dashboard |
| @tanstack/react-query | 5.62.3+ | Data fetching |
| @maxmind/geoip2-node | 5.0.0+ | IP geolocation |
| acme-client | 5.4.0+ | SSL certificate management |
| cheerio | 1.0.0+ | HTML parsing |
| ioredis | 5.4.1+ | Redis client |
| luxon | 3.5.0+ | Date/time handling |
| mailparser | 3.7.0+ | Email parsing |
| mailsplit | 5.4.0+ | Email processing |
| mjml | 4.15.3+ | Email template rendering |
| stripe | 17.3.1+ | Payment processing |
| @tiptap/react | 2.11.2+ | Rich text editor |

### Docker Services

| Service | Purpose |
|---------|---------|
| monolith | Main application |
| mysql | Primary database |
| mysql_replica | Database replica |
| redis | Caching and queues |
| kumomta-dev | Mail Transfer Agent |
| mailpit | Email testing |
| minio | S3-compatible storage |
| pebble | ACME server for SSL testing |
| dnsmasq | DNS server for local development |

### Environment Variables

The application uses environment variables loaded through the `env.mjs` script. Different environments include:

- `dev`: Local development
- `test`: Testing environment
- `coder`: Cloud development environment
- `staging`: Staging environment
- `prod`: Production environment

All environment variables should be accessed through the `appEnv` object, never directly from `process.env`.

## Project Structure

The Kibamail project follows a well-organized structure. Below is a simplified tree of the main directories and their purposes:

```
kibamail/
├── .devcontainer/         # VS Code dev container configuration
├── .github/               # GitHub Actions workflows and templates
├── ansible/               # Ansible deployment configuration
│   ├── inventory/         # Server inventory for different environments
│   ├── playbooks/         # Deployment playbooks
│   ├── roles/             # Ansible roles for different services
│   └── scripts/           # Utility scripts for deployment
├── core/                  # Main application code
│   ├── app/               # Application bootstrap and configuration
│   │   ├── actions/       # Core application actions
│   │   ├── env/           # Environment configuration
│   │   ├── ignitor/       # Application initialization
│   │   └── start/         # Entry points for different environments
│   ├── audiences/         # Contact management and segmentation
│   │   ├── actions/       # Business logic for audiences
│   │   ├── controllers/   # HTTP request handlers
│   │   ├── dto/           # Data transfer objects and validation
│   │   ├── jobs/          # Background processing tasks
│   │   ├── middleware/    # Audience-specific middleware
│   │   ├── repositories/  # Data access layer
│   │   └── utils/         # Utility functions
│   ├── auth/              # Authentication and authorization
│   │   ├── controllers/   # Auth-related controllers
│   │   ├── middleware/    # Auth middleware
│   │   ├── users/         # User management
│   │   └── password_resets/ # Password reset functionality
│   ├── automations/       # Email automation workflows
│   ├── broadcasts/        # Email campaign management
│   ├── chat/              # Community and support chat
│   ├── commerce/          # Payment and subscription management
│   ├── forms/             # Form creation and management
│   ├── injector/          # Email injection and delivery
│   ├── kumologs/          # MTA log processing
│   ├── kumomta/           # Mail Transfer Agent integration
│   │   ├── actions/       # MTA-related actions
│   │   ├── controllers/   # MTA API controllers
│   │   ├── middleware/    # MTA-specific middleware
│   │   └── policy/        # Lua policy scripts for KumoMTA
│   ├── media-library/     # Asset management
│   ├── sending_domains/   # Domain configuration and verification
│   ├── shared/            # Shared utilities and components
│   │   ├── cache/         # Caching utilities
│   │   ├── container/     # Dependency injection container
│   │   ├── controllers/   # Base controller classes
│   │   ├── middleware/    # Shared middleware
│   │   ├── repositories/  # Base repository classes
│   │   ├── routes/        # Route definitions and helpers
│   │   ├── server/        # Server configuration
│   │   ├── sessions/      # Session management
│   │   └── utils/         # Shared utility functions
│   ├── teams/             # Multi-tenant team management
│   ├── tests/             # Test suites
│   │   ├── e2e/           # End-to-end tests
│   │   ├── integration/   # Integration tests
│   │   ├── mocks/         # Test mocks
│   │   └── unit/          # Unit tests
│   ├── tools/             # Utility tools
│   ├── tracking/          # Email open and click tracking
│   ├── websites/          # Landing page and website management
│   └── worker/            # Background job processing
├── database/              # Database schema and migrations
│   ├── schema.ts          # Database schema definition
│   └── types/             # Database type definitions
├── docker/                # Docker configuration
│   ├── compose.*.yaml     # Docker Compose configurations
│   ├── kumomta/           # KumoMTA Docker configuration
│   └── mysql-init/        # MySQL initialization scripts
├── migrations/            # Database migrations
├── pages/                 # Frontend pages and components
│   ├── components/        # Reusable UI components
│   │   ├── composer/      # Email composer components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── flows/         # Workflow components
│   │   └── tiptap/        # Rich text editor components
│   ├── hooks/             # React hooks
│   ├── utils/             # Frontend utilities
│   └── w/                 # Workspace pages
│       ├── dashboard/     # Dashboard pages
│       └── engage/        # Email marketing pages
├── public/                # Static assets
├── terraform/             # Infrastructure as code
├── .env.example           # Example environment variables
├── env.mjs                # Environment loader script
├── package.json           # Project dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### Core Module Structure

Each core module follows a consistent internal structure:

```
module/
├── actions/           # Business logic
├── controllers/       # HTTP request handlers
├── dto/               # Data Transfer Objects and validation
├── jobs/              # Background processing tasks
├── middleware/        # Module-specific middleware
├── repositories/      # Data access layer
└── utils/             # Utility functions specific to the module
```

## Frontend Architecture

Kibamail uses a modern frontend architecture based on React and Vike for server-side rendering. This section explains how the frontend works and integrates with the backend.

### Vike Framework

Vike (formerly Vite-Plugin-SSR) is the server-side rendering framework used in Kibamail. It provides:

1. **Server-Side Rendering (SSR)**: Pages are pre-rendered on the server for better performance and SEO
2. **Hydration**: Client-side JavaScript takes over after initial server render
3. **Route-based Code Splitting**: Each page loads only the JavaScript it needs
4. **Data Passing**: Backend data is passed to the frontend through the `pageProps` system

#### Configuration

The Vike configuration is defined in `pages/+config.ts`:

```typescript
const config: Config = {
  title: 'Kibamail - Transactional, marketing and email automation platform.',
  ssr: true,
  extends: [vikeReact, vikeReactQuery],
  passToClient: [
    'user',
    'team',
    'pageProps',
    'userAgent',
    'isMobile',
    'memberships',
    'flash',
    'audience',
    'tags',
    'engage',
    'send',
    'sendingDomains',
  ],
  bodyAttributes: { style: '--w-sidebar-width: 260px' },
}
```

The `passToClient` array defines which data is serialized and passed from the server to the client.

### Page Rendering Process

The page rendering process follows these steps:

1. **HTTP Request**: A request comes in to a route like `/w/dashboard`
2. **Controller Handling**: The request is handled by a controller extending `VikeController`
3. **Data Preparation**: The controller prepares data to be passed as `pageProps`
4. **Page Props Resolution**: The `PagePropsResolver` enhances the props with additional data
5. **Server Rendering**: Vike's `renderPage` function renders the React components on the server
6. **Client Hydration**: The client-side JavaScript takes over for interactivity

#### VikeController

The `VikeController` is the bridge between the backend and frontend:

```typescript
export class VikeController extends BaseController {
  vikePath = (path, handler, middleware) => {
    return [
      ['GET', path, handler, middleware],
      ['GET', `${path}/index.pageContext.json`, handler, middleware],
    ]
  }

  renderVikePage = async (ctx, next, pageProps) => {
    const resolvedPageProps = await container.make(PagePropsResolver).handle(ctx, props)

    const pageContext = await renderPage({
      pageProps: resolvedPageProps,
      urlOriginal: ctx.req.url,
      headersOriginal: ctx.req.raw.headers,
    })

    // Stream response to client
    // ...
  }
}
```

#### PagePropsResolver

The `PagePropsResolver` is a crucial component that enhances page props with additional data based on the current route:

```typescript
export class PagePropsResolver {
  protected resolvers: Array<{
    new (): PagePropsResolverContract
    regex: (RegExp | string | ((pathname: string) => boolean))[]
  }> = [
    BroadcastsPropsResolver,
    EngagePropsResolver,
    EngageContactsPropsResolver,
    FlowComposerPropsResolver,
  ]

  handle = async (ctx: HonoContext, defaultPageProps: DefaultPageProps) => {
    const pathname = new URL(ctx.req.url)?.pathname.split('/index.pageContext.json')?.[0]

    const resolver = this.makeResolver(pathname)

    if (!resolver) {
      return defaultPageProps
    }

    const props = await resolver.resolve(pathname, defaultPageProps, ctx)

    return { ...props, ...defaultPageProps }
  }

  private makeResolver(pathname: string) {
    const resolver = this.resolvers.find((resolver) =>
      resolver.regex.some((route) => {
        if (typeof route === 'string') {
          return pathname === route
        }

        if (typeof route === 'function') {
          return route(pathname)
        }

        return route.test(pathname)
      }),
    )

    if (!resolver) {
      return null
    }

    return new resolver()
  }
}
```

The PagePropsResolver works as follows:

1. **Resolver Registration**: Each resolver is registered with a set of route patterns (regex, string, or function)
2. **Route Matching**: When a request comes in, the resolver finds the appropriate props resolver for the current route
3. **Props Enhancement**: The matched resolver adds additional data to the default page props
4. **Props Merging**: The enhanced props are merged with the default props and returned

Each props resolver extends the `PagePropsResolverContract` abstract class:

```typescript
export abstract class PagePropsResolverContract {
  static get regex(): (RegExp | string | ((pathname: string) => boolean))[] {
    throw new Error('Regex is not defined for this resolver.')
  }

  abstract resolve(
    pathname: string,
    defaultProps: DefaultPageProps,
    ctx: HonoContext,
  ): Promise<object>
}
```

Example of a specific props resolver:

```typescript
export class BroadcastsPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [/\/w\/engage\/broadcasts/]
  }

  async resolve(pathname: string, defaultProps: DefaultPageProps) {
    const broadcastId = pathname
      .split('/w/engage/broadcasts/')?.[1]
      ?.split('/composer')?.[0]

    const broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(broadcastId)
    const segments = await container
      .make(SegmentRepository)
      .segments()
      .findAll(eq(segmentsTable.audienceId, defaultProps.audience.id))

    return {
      broadcast: {
        ...broadcast,
        sendAt: broadcast?.sendAt ? broadcast.sendAt.toISOString() : null,
      },
      segments,
    }
  }
}
```

### Route Guards

Kibamail uses Vike's guard system to protect routes and implement navigation rules:

1. **Guard Files**: Each route can have a `+guard.ts` file that controls access
2. **Redirects**: Guards can redirect users based on authentication state or permissions
3. **Data Requirements**: Guards can ensure required data is available before rendering

Example guard for protected routes:

```typescript
// pages/w/+guard.ts
export function guard({ user, team }: PageContext) {
  if (!user) {
    throw redirect(route('auth_login'))
  }

  if (!team || team.name === DEFAULT_TEAM_NAME) {
    throw redirect(route('auth_register_profile'))
  }
}
```

### Data Flow

Data flows from the backend to the frontend through several mechanisms:

1. **Page Props**: Main data channel from server to client
2. **Server Queries**: Client-side data fetching using React Query
3. **Server Forms**: Form submissions with validation and error handling

#### Page Props

Page props are passed from the server to the client during the initial render:

```typescript
// In a controller
async index(ctx: HonoContext) {
  return this.page(ctx, {
    contacts: await this.contactRepository.getContacts(),
    // Other data...
  })
}

// In a React component
function ContactsPage() {
  const { contacts } = usePageProps()
  // Use contacts data...
}
```

#### Server Queries

For client-side data fetching, Kibamail uses custom hooks built on React Query:

```typescript
// Custom hook for server queries
export function useServerQuery<TData>(queryOptions) {
  return useQuery({
    queryKey: [queryOptions.queryKey],
    async queryFn() {
      const response = await fetch(queryOptions.queryKey)
      const json = await response.json()
      return json.payload
    },
    // Other options...
  })
}

// Usage in a component
function ContactsList() {
  const { data, isLoading } = useServerQuery({
    queryKey: `/api/contacts?page=${page}`,
    initialData: pageProps.contacts,
  })

  // Render contacts...
}
```

#### Server Forms

For form submissions, Kibamail uses a custom `ServerForm` component and `useServerFormMutation` hook:

```typescript
function LoginForm() {
  const { serverFormProps, isPending, error } = useServerFormMutation({
    action: '/auth/login',
    method: 'POST',
  })

  return (
    <ServerForm {...serverFormProps}>
      <TextField.Root>
        <TextField.Label>Email</TextField.Label>
        <TextField.Input name="email" type="email" required />
      </TextField.Root>
      {/* Other form fields */}
      <Button type="submit" loading={isPending}>Login</Button>
    </ServerForm>
  )
}
```

### Component Architecture

Kibamail's frontend components follow a hierarchical structure:

1. **Page Components**: Top-level components for each route
2. **Layout Components**: Shared layouts like dashboard, sidebar, etc.
3. **Feature Components**: Components specific to features like email composer
4. **UI Components**: Reusable UI elements from the Owly design system

#### Component Organization

```
pages/
├── components/           # Shared components
│   ├── composer/         # Email composer components
│   ├── dashboard/        # Dashboard layout components
│   ├── flows/            # Workflow components
│   └── tiptap/           # Rich text editor components
├── hooks/                # Custom React hooks
├── utils/                # Frontend utilities
└── w/                    # Workspace pages
    ├── dashboard/        # Dashboard pages
    └── engage/           # Email marketing pages
```

### State Management

Kibamail uses a combination of state management approaches:

1. **React Context**: For feature-specific state that needs to be shared
2. **React Query**: For server state and data fetching
3. **Local Component State**: For UI state specific to a component

Example of context-based state management:

```typescript
// Context definition
export const [OnboardingProvider, useOnboardingContext] = createContext<{
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
  formState: FormState
  setFormState: React.Dispatch<React.SetStateAction<FormState>>
}>('OnboardingContext')

// Provider usage
function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [formState, setFormState] = useState(initialState)

  return (
    <OnboardingProvider step={step} setStep={setStep} formState={formState} setFormState={setFormState}>
      {step === 1 && <StepOne />}
      {step === 2 && <StepTwo />}
      {/* Other steps */}
    </OnboardingProvider>
  )
}

// Consumer usage
function StepOne() {
  const { formState, setFormState, setStep } = useOnboardingContext()

  // Component logic...
}
```
