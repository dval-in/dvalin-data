export type Achievement = {
	id: number;
	name: string;
	desc: string;
	reward: number;
	hidden: boolean;
	order: number;
	version: string;
	region?: string;
	quest?: string;
	questType?: 'worldQuests' | 'archonQuests' | 'commissions';
};

export type AchievementCategory = {
	_id: number;
	id: string;
	name: string;
	order: number;
	achievements: Achievement[];
};
