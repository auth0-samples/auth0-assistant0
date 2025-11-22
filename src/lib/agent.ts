import { createReactAgent, ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { InMemoryStore, MemorySaver } from '@langchain/langgraph';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { GmailCreateDraft, GmailSearch } from '@langchain/community/tools/gmail';

import { withCalendar, withGmailRead, withGmailWrite, withAsyncAuthorization } from './auth0-ai';
import { getUserInfoTool } from './tools/user-info';
import { shopOnlineTool } from './tools/shop-online';
import { getContextDocumentsTool } from './tools/context-docs';
import { getCalendarEventsTool, createCalendarEventsTool } from './tools/google-calender';

const date = new Date().toISOString();

// TODO: Can the onboarding documents be moved into an onboarding guide and be fetched with "getContextDocumentsTool"
const ONBOARDING_GUIDE = `
Detta är Hejares guide för onboarding:
I rekryterarnas kalendrar:
- Lägg in en notis 1 månad innan kollegan börjar
- Lägg in första 6 månaderna som anställd för att ha koll på när provanställning löper ut. (alltså 1 notis varje månad, om hen börjar 1 mars ska det 1 april stå "xx 1 månad" och 1 maj stå "xx 2 månader" osvosv)
- Registrera personen i g-suite så hen får en mailadress
- Lägg till den nya hejaren i Hejares och Skojs slack
- Bjud in den nya hejaren till viktiga Slack-kanaler, t. ex #admin #beslut #självstyre #frånvaro #hej osvosvosv om hen inte redan fått en automatisk inbjudan dit (jag vet inte vilka man automatiskt blir inbjuden till)
- Lägg till personen i GitHub (mest för konsult)
- Lägg till personen på https://momang.io/sv
- Synka med sälj om vem som skriver kandidatens Momang-CV och skicka kandidatens cv till säljaren

- Skicka en påminnelse till rekryteraren en månad innan kollegan börjar om att hen måste ringa kandidaten och berätta:
-- Hen fått inbjudningar osv till programmen vi använder oss av
-- Be personen skriva hej i både #general Hejare och #general Skoj
-- Be personen lägga till bilder på alla forum
-- Be den nya hejaren läsa på intrasidan/canvan och ställa frågor om hen har. Onboarda själv, ställa frågor om det dyker upp.
-- Be personen addera uppgifter i “Om mig” och “Hejare register” på Google Drive

- Skicka en påminnelse till rekryteraren en månad innan kollegan börjar om att hen måste:
-- Lägga till personen i Fortnox, ta info från Hejare register. (Först i “Register - personal”, se till att ha lönberättigheten”, kolla alla flikar efter * markerade rutor! Sedan i “Hejare AB→ administrera användare”. Om semesterrätten är fler än 25 - ändra manuellt!)
-- Registrera pension och försäkring i Avanza (om den skrivit ja i "Hejare register") --> “Anställda → lägg till ny försäkring” (Emma/Ellen/Malin som har acess)
-- Tilldela kollegan en buddy
-- Tilldela kollegan en bubbla

- Beställ simkort på Hallon (om kandidaten vill ha ett), nummerflytt ska ske då den nya hejaren har simkortet i handen (nummerflytt kan ej ske innan dess). Simkortet kan bara beställas till företagsadressen (skicka det vidare eller så får hejaren hämta det själv)
- Lägg till personen i Hejare gemensam och Skoj gemensam på Driven. Detta via Google admin sidan, för Hejare driven är det “Hejare - members” och Skoj “Skoj - Members”
- Lägg till personen i Pleo, gör personen till admin
- Om det är ett Hejare event (aw/bubbla/självstyre/julfest osvosvosv) innan kollegan börjar, uppmana/bjud in denne att komma!
- Förbered onboarding dagar - hur dessa är beror på om denne är konsult och har uppdrag dag ett eller inte, hur junior eller senior den nya kollegan är, vilka kollegor som är tillgängliga att kunna hjälpa till
`

const AGENT_SYSTEM_TEMPLATE = `
  Du är en HR-assistent på konsultbolaget Hejare som heter Hejbert. Du pratar bara svenska. 
  Du är en hjälpsam assistent som kan svara på frågor och hjälpa till med uppgifter. 
  Du har tillgång till olika typer av verktyg. Använd dessa för att svara på användarens frågor och utför uppgifter användaren ber om.
  Om användaren ger dig en uppgift som du inte har verktygen till att utföra, ge istället kortfattade instruktioner för hur användaren själv löser uppgiften. 

  Innan du svarar på en fråga eller utför en uppgift, beskriv din plan för användaren och be den konfirmera. 

  Render the email body as a markdown block, do not wrap it in code blocks. Today is ${date}.
  
  ${ONBOARDING_GUIDE}
  `;


const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
});

// Provide the access token to the Gmail tools
const gmailParams = {
  credentials: {
    accessToken: async () => {
      const { getAccessToken } = await import('./auth0-ai');
      return getAccessToken();
    },
  },
};

const tools = [
  new Calculator(),
  // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
  // new SerpAPI(),
  withGmailRead(new GmailSearch(gmailParams)),
  withGmailWrite(new GmailCreateDraft(gmailParams)),
  withCalendar(getCalendarEventsTool),
  withCalendar(createCalendarEventsTool),
  getUserInfoTool,
  withAsyncAuthorization(shopOnlineTool),
  getContextDocumentsTool,
];

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

/**
 * Use a prebuilt LangGraph agent.
 */
export const agent = createReactAgent({
  llm,
  tools: new ToolNode(tools, {
    // Error handler must be disabled in order to trigger interruptions from within tools.
    handleToolErrors: false,
  }),
  // Modify the stock prompt in the prebuilt agent.
  prompt: AGENT_SYSTEM_TEMPLATE,
  store,
  checkpointer,
});