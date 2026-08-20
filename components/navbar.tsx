import Link from "next/link";

const Navbar = () => {
    return <div>
        <Link href={"/"}>Home Page </Link><br />
        <Link href={"/chat_template"}>Chat Template </Link><br />
        <Link href={"/chat_single_fixed_message"}>Single Fixed Message Chat Page </Link><br />
        <Link href={"/chat_single_message"}>Single Message Chat Page </Link><br />
        <Link href={"/chat_several_messages"}>A Conversation of Message Chat Page (with tool use)</Link><br />
        <Link href={"/chat_conversation_using_sdk_basic"}>Basic Conversation Page using AWS SDK</Link><br />
        <Link href={"/chat_streaming_using_sdk_basic"}>Basic Streaming Conversation Page using AWS SDK</Link><br />
    </div>
}

export default Navbar;