import { Inngest } from 'inngest';

// One shared Inngest client — imported by all function files and the API route.
// In development, use INNGEST_EVENT_KEY=local + `npx inngest-cli@latest dev`.
export const inngest = new Inngest({
  id: 'coachly',
  name: 'Coachly',
});
