# Assistant0: An AI Personal Assistant Secured with Auth0

Assistant0 an AI personal assistant that consolidates your digital life by dynamically accessing multiple tools to help you stay organized and efficient.

Available Versions:

- [LangGraph.js](https://github.com/auth0-samples/auth0-assistant0/tree/main/ts-langchain)
- [LangGraph Python](https://github.com/auth0-samples/auth0-assistant0/tree/main/py-langchain)
- [Vercel AI](https://github.com/auth0-samples/auth0-assistant0/tree/main/ts-vercel-ai)
- [LlamaIndex.TS](https://github.com/auth0-samples/auth0-assistant0/tree/main/ts-llamaindex)
- [LlamaIndex Python](https://github.com/auth0-samples/auth0-assistant0/tree/main/py-llamaindex)

Here’s some of the features that are implemented:

1. **Gmail Integration:** The assistant can scan your inbox to generate concise summaries. It can highlight urgent emails, categorizes conversations by importance, and even suggests drafts for quick replies.
2. **Calendar Management:** By interfacing with your calendar, it can remind you of upcoming meetings, check for scheduling conflicts, and even propose the best time slots for new appointments based on your availability.
3. **User Information Retrieval:** The assistant can retrieve information about the user from their authentication profile, including their name, email, and other relevant details.
4. **Online Shopping with Human-in-the-Loop Authorizations:** The assistant can make purchases on your behalf (using a fake API for demo purposes), with the ability to ask for human confirmation before finalizing transactions.
5. **Document Upload and Retrieval:** The assistant can upload PDF and text documents to the database and retrieve them for context during chat. The docs can be shared with other users.
6. **List GitHub repositories and events:** The assistant can retrieve a list of your GitHub repositories and their events, providing quick access to your projects and their status.
7. **Slack Notifications [coming soon]:** For team communications, the assistant can monitor Slack channels. It identifies key messages and creates action items, ensuring you never miss an important update from your colleagues.
8. **Google Drive Access [coming soon]:** Whether you need immediate access to the latest project document or a file related to a current task, the assistant retrieves pertinent documents from Google Drive on demand. It can create document summaries and even create documents based on your instructions.

With tool-calling capabilities, the possibilities are endless. In this conceptual scenario, the AI agent embodies a digital personal secretary—one that not only processes information but also proactively collates data from connected services to provide comprehensive task management. This level of integration not only enhances efficiency but also ushers in a new era of intelligent automation, where digital assistants serve as reliable, all-in-one solutions that tailor themselves to your personal and professional needs.

![A streaming conversation between the user and the AI](./public/images/home-page.png)

## Security Challenges with Tool Calling AI Agents

Building such an assistant is not too difficult. Thanks to frameworks like [LangChain](https://www.langchain.com/), [LlamaIndex](https://www.llamaindex.ai/), and [Vercel AI](https://vercel.com/ai), you can get started quickly. The difficult part is doing it securely so that you can protect the user's data and credentials.

Many current solutions involve storing credentials and secrets in the AI agent application’s environment or letting the agent impersonate the user. This is not a good idea, as it can lead to security vulnerabilities and excessive scope and access for the AI agent.

## Tool Calling with the Help of Auth0

This is where Auth0 comes to the rescue. As the leading identity provider (IdP) for modern applications, our upcoming product, [Auth for GenAI](https://a0.to/ai-content), provides standardized ways built on top of OAuth and OpenID Connect to call APIs of tools on behalf of the end user from your AI agent.

Auth0's [Token Vault](https://auth0.com/docs/secure/tokens/token-vault) feature helps broker a secure and controlled handshake between the AI agents and the services you want the agent to interact with on your behalf – in the form of scoped access tokens. This way, the agent and LLM do not have access to the credentials and can only call the tools with the permissions you have defined in Auth0. This also means your AI agent only needs to talk to Auth0 for authentication and not the tools directly, making integrations easier.

![Tool calling with Federated API token exchange](https://images.ctfassets.net/23aumh6u8s0i/1gY1jvDgZHSfRloc4qVumu/d44bb7102c1e858e5ac64dea324478fe/tool-calling-with-federated-api-token-exchange.jpg)

## Learn more

- [Tool Calling in AI Agents: Empowering Intelligent Automation Securely](https://auth0.com/blog/genai-tool-calling-intro/)
- [Build an AI Assistant with LangGraph, Vercel, and Next.js: Use Gmail as a Tool Securely](https://auth0.com/blog/genai-tool-calling-build-agent-that-calls-gmail-securely-with-langgraph-vercelai-nextjs/)
- [Auth for GenAI Docs](https://auth0.com/ai/docs)

## License

This project is open-sourced under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

This project is built by [Deepu K Sasidharan](https://github.com/deepu105) and other contributors.
