import LitJsSdk from '@lit-protocol/sdk-browser';

const client = new LitJsSdk.LitNodeClient();
const chain = 'ethereum';

// Checks if the user has at least 0 ETH
const accessControlConditions = [
	{
		contractAddress: '',
		standardContractType: '',
		chain,
		method: 'eth_getBalance',
		parameters: [':userAddress', 'latest'],
		returnValueTest: {
			comparator: '>=',
			value: '0',
		},
	},
];

class Lit {
	litNodeClient;

	async connect() {
		await client.connect();
		this.litNodeClient = client;
	}

	async encrypt(message) {
		if (!this.litNodeClient) {
			await this.connect();
		}

		const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
		const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
			message
		);

		const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
			accessControlConditions,
			symmetricKey,
			authSig,
			chain,
		});

		return {
			encryptedString,
			encryptedSymmetricKey: LitJsSdk.uint8arrayToString(
				encryptedSymmetricKey,
				'base16'
			),
		};
	}

	async decrypt(encryptedString, encryptedSymmetricKey) {
		console.log('the decrypt function has been called');
		if (!this.litNodeClient) {
			await this.connect();
		}
		console.log('lit node instantiated');

		const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain });
		const symmetricKey = await this.litNodeClient.getEncryptionKey({
			accessControlConditions,
			toDecrypt: encryptedSymmetricKey,
			chain,
			authSig,
		});
		console.log('Got the symmetric key: ', symmetricKey);

		const decryptedString = await LitJsSdk.decryptString(
			encryptedString,
			symmetricKey
		);
		console.log('Got the string.. wohooo: ', decryptedString);

		return { decryptedString };
	}
}

export default new Lit();
