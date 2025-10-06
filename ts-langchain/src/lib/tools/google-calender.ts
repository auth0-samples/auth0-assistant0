import { tool } from '@langchain/core/tools';
import { endOfDay, formatISO, startOfDay } from 'date-fns';
import { GaxiosError } from 'gaxios';
import { google } from 'googleapis';
import { z } from 'zod';
import { FederatedConnectionError } from '@auth0/ai/interrupts';

import { getAccessToken } from '../auth0-ai';

export const getCalendarEventsTool = tool(
  async ({ date }) => {
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
          throw new FederatedConnectionError(`Authorization required to access the Federated Connection`);
        }
      }

      throw error;
    }
  },
  {
    name: 'get_calendar_events',
    description: `Get calendar events for a given date from the user's Google Calendar`,
    schema: z.object({
      date: z.coerce.date(),
    }),
  },
);
