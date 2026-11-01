import { useState } from 'react';
import {usePlaidLink} from "react-plaid-link";


export default function AccountsPage() {
    const [linkToken, setLinkToken] = useState<string | null>(null);

    async function initializeLink() {
        // add path to backend server once routes are made
        const linkTokenResponse = await fetch("/generate_link_token", {
            method: "POST",
        })
        if (!linkTokenResponse.ok) {
            throw new Error("Could not find link token");
        }
        const data : { link_token : string } = await linkTokenResponse.json();
        setLinkToken(data.link_token);

        console.log(JSON.stringify(data.link_token));
    }

    const {open, ready} = usePlaidLink({
        token: linkToken,

        onSuccess: async (publicToken) => {
            if (!publicToken) { return; }

            const response = await fetch("/swap_public_token", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({public_token: publicToken}),
            });

            if (!response.ok) {
                throw new Error("Token exchange failed");
            }
        }
    })


    return (
        <div className="PageLink" id="AccountsPage"> 
            <h1>Accounts</h1>
            <button onClick={() => initializeLink()} id="startLink">Prepare connection</button>
            <button disabled={!ready} onClick={() => open()} >Connect Bank</button>
        </div>
    );
}
