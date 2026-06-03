import { tool } from '@langchain/core/tools';
import { endOfDay, formatISO, startOfDay } from 'date-fns';
import { GaxiosError } from 'gaxios';
import { google } from 'googleapis';
import { z } from 'zod';
import { TokenVaultError } from '@auth0/ai/interrupts';

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
          throw new TokenVaultError(`Authorization required to access the Token Vault connection.`);
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

export const createCalendarEventsTool = tool(
  async ({ summary, description, startDateTime, endDateTime, location, attendees }) => {
    // Get the access token from Auth0 AI
    const accessToken = await getAccessToken();

    // Google SDK
    try {
      const calendar = google.calendar('v3');
      const auth = new google.auth.OAuth2();

      auth.setCredentials({
        access_token: accessToken,
      });

      // Create the event
      const response = await calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: {
          summary,
          description,
          location,
          start: {
            dateTime: startDateTime,
            timeZone: 'UTC',
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'UTC',
          },
          attendees: attendees?.map((email) => ({ email })),
        },
      });

      const event = response.data;

      return {
        success: true,
        eventId: event.id,
        summary: event.summary,
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        location: event.location,
        htmlLink: event.htmlLink,
        message: `Successfully created calendar event: ${event.summary}`,
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
  {
    name: 'create_calendar_event',
    description: `Create a new event in the user's Google Calendar. Use this tool to schedule meetings, appointments, or reminders.`,
    schema: z.object({
      summary: z.string().describe('The title/summary of the event'),
      description: z.string().optional().describe('Detailed description of the event'),
      startDateTime: z.string().describe('Start date and time in ISO 8601 format (e.g., 2025-11-12T14:00:00Z)'),
      endDateTime: z.string().describe('End date and time in ISO 8601 format (e.g., 2025-11-12T15:00:00Z)'),
      location: z.string().optional().describe('Location of the event'),
      attendees: z.array(z.string()).optional().describe('Array of email addresses of attendees to invite'),
    }),
  },
);
