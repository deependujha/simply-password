import lit from '../lit_protocol/lit.js';
import pinataSDK from '@pinata/sdk';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import axios from 'axios';
import toStream from 'blob-to-stream';
import streamToBlob from 'stream-to-blob';
const noAuthError =
	'The access control condition check failed! You should have at least 0 ETH to decrypt this file.';

export default function Home() {
	const [input, setinput] = useState('');
	const [encryptedText, setEncryptedText] = useState('');
	const [decryptedText, setDecryptedText] = useState('');
	const [enSymmetricKey, setEnSymmetricKey] = useState(null);
	const [IPFSHash, setIPFSHash] = useState('');

	const stringToEncrypt =
		'This is what we want to encrypt on Lit and then store on ceramic';
	//
	// (Helper) Turn blob data to data URI
	// @param { Blob } blob
	// @return { Promise<String> } blob data in data URI
	//
	const blobToDataURI = (blob) => {
		return new Promise((resolve, reject) => {
			var reader = new FileReader();

			reader.onload = (e) => {
				var data = e.target.result;
				resolve(data);
			};
			reader.readAsDataURL(blob);
		});
	};

	//
	// (Helper) Convert data URI to blob
	// @param { String } dataURI
	// @return { Blob } blob object
	//
	const dataURItoBlob = (dataURI) => {
		console.log(dataURI);

		var byteString = window.atob(dataURI.split(',')[1]);
		var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
		var ab = new ArrayBuffer(byteString.length);
		var ia = new Uint8Array(ab);
		for (var i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}

		var blob = new Blob([ab], { type: mimeString });

		return blob;
	};

	const encryptInput = async () => {
		if (input === '') {
			alert('Please enter some text to encrypt it');
			return;
		}

		const { encryptedString, encryptedSymmetricKey } = await lit.encrypt(input);
		console.log('Printing encrypted symmetric key', encryptedSymmetricKey);
		console.log('Printing encrypted string', encryptedString);
		console.log('--------------------------------');
		console.log(
			'printing type of encrypted symmetric key: ',
			typeof encryptedSymmetricKey
		);
		console.log('printing type of encrypted string: ', typeof encryptedString);

		const encryptedStringInDataURI = await blobToDataURI(encryptedString);
		setEnSymmetricKey(encryptedSymmetricKey);
		// setEncryptedText(encryptedStringInDataURI);
		console.log('printing blob to data uri: ', encryptedStringInDataURI);
		console.log(
			'printing type of blob to data uri: ',
			typeof encryptedStringInDataURI
		);
		// console.log('encryptedStringInDataURI: ', encryptedStringInDataURI);
		const pinata = new pinataSDK(
			'PINATA_API_KEY',
			'PINATA_SECRET_API_KEY'
		);

		const options = {
			pinataMetadata: {
				name: 'timeForGlory',
				keyvalues: {
					customKey: 'keep',
					customKey2: 'hustling',
				},
			},
			pinataOptions: {
				cidVersion: 1,
			},
		};

		const myJson = {
			value: encryptedStringInDataURI,
		};
		pinata
			.pinJSONToIPFS(myJson, options)
			.then((result) => {
				//handle results here
				console.log(result);
				setIPFSHash(result.IpfsHash);
			})
			.catch((err) => {
				//handle error here
				console.log(err);
			});
	};

	const decryptInput = async () => {
		axios
			.get(`https://gateway.pinata.cloud/ipfs/${IPFSHash}`)
			.then(async (response) => {
				console.log('my response: ');
				console.log(response);
				try {
					const deependu = await dataURItoBlob(response.data.value);
					// console.log('encrypted text: ', encryptedText);
					const decrypted = await lit.decrypt(deependu, enSymmetricKey);
					console.log('decrypted text: ', decrypted);
					console.log(decrypted);
				} catch (error) {
					console.log('error occurred in decrypting', error);
					// alert(noAuthError);
				}
			})
			.catch((err) => {
				console.log(
					'error occurred while fetching data from IPFS (PINATA API)'
				);
				console.log(err);
			});
	};

	return (
		<div className={styles.container}>
			<Head>
				<title>Learning Lit protocol</title>
				<meta name="description" content="learning lit protocol." />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<h1 className={styles.title} style={{ color: 'blueviolet' }}>
					String Encrypter and Decrypter
				</h1>

				<p className={styles.description}>
					<input
						type="text"
						id="first_name"
						className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="Enter some text..."
						required
						value={input}
						onChange={(e) => setinput(e.target.value)}
					/>
				</p>
				<div className="flex">
					<div className="flex-auto w-32 ">
						<button
							type="button"
							className="text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
							onClick={encryptInput}
						>
							Encrypt{' '}
						</button>
					</div>
					<div className="flex-auto w-32 ">
						<button
							type="button"
							className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
							onClick={decryptInput}
						>
							Decrypt{' '}
						</button>
					</div>
				</div>

				<hr />
			</main>

			<footer className={styles.footer}>
				<a
					href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
					target="_blank"
					rel="noopener noreferrer"
				>
					Powered by{' '}
					<span className={styles.logo}>
						<Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
					</span>
				</a>
			</footer>
		</div>
	);
}
