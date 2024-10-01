type AchievementExtraData = {
	achievement: string;
	description: string;
	requirements: string;
	hidden?: string;
	type?: string;
	version?: string;
	primo: string;
	steps?: string[];
	id?: number;
	requirementQuestLink?: string;
}[];

export { AchievementExtraData };
