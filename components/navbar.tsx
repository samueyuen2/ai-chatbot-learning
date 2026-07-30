import Link from "next/link";

const Navbar = () => {
    return <div>
        <Link href={"/"}>Home Page </Link><br />
        <Link href={"/chat_template"}>Chat Template </Link><br />
        <Link href={"/chat_single_fixed_message"}>Single Fixed Message Chat Page </Link><br />
        <Link href={"/chat_single_message"}>Single Message Chat Page </Link><br />
        {/* <Link href={"/chat"}>Chat Page</Link> */}
    </div>
}

export default Navbar;