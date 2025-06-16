'use client';

import { useUser } from '@auth0/nextjs-auth0';

import { ChatWindow } from '@/components/ChatWindow';
import { InfoCard } from '@/components/InfoCard';

export default function Home() {
    const { user, isLoading } = useUser();
    console.log('User: ', user);
    if (isLoading) return <div>Loading....</div>;

    if (!user) {
        return (
            <main className="flex flex-col items-center justify-center h-screen p-10">
                <a href="/auth/login?screen_hint=signup">
                    <button>Sign up</button>
                </a>
                <a href="/auth/login">
                    <button>Log in</button>
                </a>
            </main>
        );
    }

    return (
        <ChatWindow
            endpoint="api/chat"
            emoji="🤖"
            placeholder="I'm your personal assistant. How can I help you today?"
            emptyStateComponent={<InfoCard />}
        />
    );
}
