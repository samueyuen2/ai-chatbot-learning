"use client"

const getMessageV2 = async () => {
    const res = await fetch(`${process.env.DOMAIN}/api/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Tom" })
    })
    return await res.json()
}

export default function Button() {
    return <button onClick={() => { getMessageV2 }}></button>
}