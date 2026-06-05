# Database

## Entity Relationship Summary

`Profile` is the application-level user table and uses the same UUID as Supabase `auth.users`. Most user-owned records reference `Profile.id`.

Main content hierarchy:

`LearningPath -> Room -> RoomTask`

Quiz hierarchy:

`Room -> Quiz -> QuizQuestion -> QuizOption`

Progress hierarchy:

`Profile -> UserRoomProgress`

Submissions:

`Profile -> UserTaskSubmission -> RoomTask`

Quiz attempts:

`Profile -> UserQuizAttempt -> Quiz`

Instructor monitoring:

`Profile(INSTRUCTOR) -> Class -> ClassMember -> Profile(STUDENT)`

## Important Tables

`Profile`

Stores email, full name, username, role, avatar URL, and timestamps. Public registration always creates `STUDENT`.

`LearningPath`

Groups related rooms by category, difficulty, and estimated hours.

`Room`

Represents a learning room. Each room belongs to one learning path and can have tasks, a quiz, progress rows, and lab sessions.

`RoomTask`

Represents a safe educational task. `expectedAnswer` is stored server-side and checked only by backend services.

`Quiz`, `QuizQuestion`, `QuizOption`

Support room quizzes. Public quiz fetches omit correctness data through the service mapping.

`UserRoomProgress`

Tracks room status and percentage by user.

`LeaderboardPoint`

Stores point events instead of only aggregate totals. Aggregation is done with Prisma groupBy.

`LabSession`

Placeholder for future authorized lab orchestration. It tracks state but does not start real infrastructure.

## Role Model

Roles are:

- `STUDENT`
- `INSTRUCTOR`
- `ADMIN`

Role hierarchy:

`ADMIN > INSTRUCTOR > STUDENT`

Role changes are admin-only through server-side routes.

## Progress Tracking Model

Task submissions can update room progress when answers are correct. Passing a quiz can complete a room. Progress is stored in `UserRoomProgress` with:

- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`

## Lab Session Placeholder Model

Lab sessions support:

- `status`: `READY`, `STARTING`, `RUNNING`, `STOPPED`, `EXPIRED`, `ERROR`
- `vpnStatus`: `DISCONNECTED`, `CONNECTING`, `CONNECTED`
- `machineStatus`: `OFFLINE`, `STARTING`, `ONLINE`, `STOPPING`

Future VM/container orchestration should update these fields from a server-only orchestration layer.
