export const uint8ArrayFromBinaryString = (binaryString: string) => {
	const uint8Array = new Uint8Array(binaryString.length);

	for (let i = 0; i < binaryString.length; ++i) {
		uint8Array[i] = binaryString.charCodeAt(i);
	}

	return uint8Array;
};
