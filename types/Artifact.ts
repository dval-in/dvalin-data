type ArtifactSet = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description?: string;
};

export type Artifact = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	min_rarity: number;
	max_rarity: number;
	flower?: ArtifactSet;
	plume?: ArtifactSet;
	sands?: ArtifactSet;
	goblet?: ArtifactSet;
	circlet?: ArtifactSet;
	onePiece?: string;
	twoPiece?: string;
	fourPiece?: string;
};
