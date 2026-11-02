import { useState } from 'react';
import {usePlaidLink} from "react-plaid-link";
import { postJson } from '../api/client';


export default function AccountsPage() {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isPreparing, setIsPreparing] = useState(false);

    async function initializeLink() {
        setError('');
        setIsPreparing(true);
        try {
            const data = await postJson<{ link_token: string }>('/generate_link_token');
            setLinkToken(data.link_token);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not prepare the bank connection.');
        } finally {
            setIsPreparing(false);
        }
    }

    const {open, ready} = usePlaidLink({
        token: linkToken,

        onSuccess: async (publicToken) => {
            if (!publicToken) { return; }

            setError('');
            try {
                await postJson('/swap_public_token', { public_token: publicToken });
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Could not connect the bank.');
            }
        }
    })


    return (
        <div className="PageLink" id="AccountsPage"> 
            <h1>Accounts</h1>
            {error && <p role="alert">{error}</p>}
            <button disabled={isPreparing} onClick={initializeLink} id="startLink">
                {isPreparing ? 'Preparing…' : 'Prepare connection'}
            </button>
            <button disabled={!ready} onClick={() => open()} >Connect Bank</button>
        </div>
    );
}
