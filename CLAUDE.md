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
