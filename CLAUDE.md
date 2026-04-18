**Application Description – Stuttgart Transit Companion App**

The planned application is a web-based transit information service focused on the Stuttgart metropolitan area (VVS region). Its purpose is to provide users with fast and reliable public transport connection information, including departure times, arrival times, and route details for regional and S-Bahn services.

The application allows users to query connections between two stations (e.g., Feuersee to Stuttgart Hauptbahnhof) and retrieve the next available departures after a specified time. The system processes timetable data to calculate relevant trips and presents structured connection results in a clear and minimal interface.

The DB API will be used exclusively to retrieve official timetable and connection data for train services operating in the Stuttgart region. The data will be consumed via secure API requests and used to display planned departure and arrival times within the application. No timetable data will be redistributed or resold; it will only be displayed to end users within the context of the application.

The application is intended as a technical project focused on building a performant, user-friendly interface for querying public transport connections. It does not modify, store long-term, or commercially exploit Deutsche Bahn data beyond what is necessary for providing connection results to users.

The system architecture is based on a modern web stack with a backend API layer that queries the DB API and formats the response for frontend display.

**Code style**

- **Always wrap the code after if statements in curly braces. ALWAYS!!**
- **Always import the types from React and don't use eg React.FC.**
- **Always prefer arrow functions over function declarations even for components.**
- **Always prefer export const over export default except nextjs forces to use export default.**
- **Always try to use FC<'PropsType'> for components.**
- **Always use `clsx` for conditional class names. Import it if it is not already imported.**
- **React Compiler is enabled. Follow the guidance for the react compiler for memoization.**

<!-- BEGIN:nextjs-agent-rules -->

### NextJS related

**This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

### SPEC.md Maintenance

**`SPEC.md` is the single source of truth for the project's architecture and structure.** Every agent must follow these rules:

1. **Before starting work:** Read `SPEC.md` to understand the project structure, existing patterns, and conventions.
2. **After completing a feature or structural change:** Update `SPEC.md` to reflect what changed. This includes but is not limited to:
    - New or removed API endpoints
    - New or removed database tables/columns
    - New or removed hooks
    - New or removed UI components (atoms/molecules/organisms)
    - New or removed server actions
    - Changes to environment variables
    - Changes to data fetching patterns or key design decisions
3. **Keep updates minimal and precise.** Only update the sections that are affected by your changes. Do not rewrite unrelated sections.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
