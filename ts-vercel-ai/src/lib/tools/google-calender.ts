import { tool } from 'ai';
import { endOfDay, formatISO, startOfDay } from 'date-fns';
import { GaxiosError } from 'gaxios';
import { google } from 'googleapis';
import { z } from 'zod';
import { TokenVaultError } from '@auth0/ai/interrupts';

import { getAccessToken, withGoogleConnection } from '../auth0-ai';

export const getCalendarEventsTool = withGoogleConnection(
  tool({
    description: `Get calendar events for a given date from the user's Google Calendar`,
    inputSchema: z.object({
      date: z.coerce.date(),
    }),
    execute: async ({ date }) => {
      // Get the access token from Auth0 AI
      const accessToken = await getAccessToken();

      // Google SDK
      try {
        const calendar = google.calendar('v3');
        const auth = new google.auth.OAuth2();

        auth.setCredentials({
          access_token: accessToken,
        });

        // Get events for the entire day
        const response = await calendar.events.list({
          auth,
          calendarId: 'primary',
          timeMin: formatISO(startOfDay(date)),
          timeMax: formatISO(endOfDay(date)),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50,
        });

        const events = response.data.items || [];

        return {
          date: formatISO(date, { representation: 'date' }),
          eventsCount: events.length,
          events: events.map((event) => ({
            id: event.id,
            summary: event.summary || 'No title',
            description: event.description,
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            location: event.location,
            attendees:
              event.attendees?.map((attendee) => ({
                email: attendee.email,
                name: attendee.displayName,
                responseStatus: attendee.responseStatus,
              })) || [],
            status: event.status,
            htmlLink: event.htmlLink,
          })),
        };
      } catch (error) {
        if (error instanceof GaxiosError) {
          if (error.status === 401) {
            throw new TokenVaultError(`Authorization required to access the Token Vault connection.`);
          }
        }

        throw error;
      }
    },
  }),
);
