import { GuideInfoBox } from '@/components/guide/GuideInfoBox';

export const InfoCard = () => {
    return (
        <GuideInfoBox>
            <ul>
                <li className="text-l">
                    🤝
                    <span className="ml-2">
                        This template showcases a simple chatbot using{' '}
                        <a className="text-blue-500" href="https://langchain-ai.github.io/langgraphjs/" target="_blank">
                            LangGraph.js
                        </a>
                        ,{' '}
                        <a className="text-blue-500" href="https://js.langchain.com/docs/introduction/" target="_blank">
                            LangChain.js
                        </a>{' '}
                        and the Vercel{' '}
                        <a className="text-blue-500" href="https://sdk.vercel.ai/docs" target="_blank">
                            AI SDK
                        </a>{' '}
                        in a{' '}
                        <a className="text-blue-500" href="https://nextjs.org/" target="_blank">
                            Next.js
                        </a>{' '}
                        project.
                    </span>
                </li>
                <li className="hidden text-l md:block">
                    💻
                    <span className="ml-2">
                        You can find the prompt and model logic for this use-case in <code>app/api/chat/route.ts</code>.
                    </span>
                </li>
                <li className="hidden text-l md:block">
                    🎨
                    <span className="ml-2">
                        The main frontend logic is found in <code>app/page.tsx</code>.
                    </span>
                </li>
                <li className="text-l">
                    👇
                    <span className="ml-2">
                        Try asking e.g. <code>What can you help me with?</code> below!
                    </span>
                </li>
            </ul>
        </GuideInfoBox>
    )
}
