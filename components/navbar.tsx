import Link from "next/link";

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar__brand">
                AI Chat
            </div>

            <div className="navbar__links">
                <Link href="/">Home</Link>
                <Link href="/chat_template">Template</Link>
                <Link href="/chat_single_fixed_message">Fixed Message</Link>
                <Link href="/chat_single_message">Single Message</Link>
                <Link href="/chat_several_messages">Conversation</Link>
                <Link href="/chat_conversation_using_sdk_basic">SDK Conversation</Link>
                <Link href="/chat_streaming_using_sdk_basic">Streaming</Link>
            </div>
        </nav>
    );
};

export default Navbar;