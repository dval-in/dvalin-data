export type JsonObject = { [key: string]: any };

export interface MergeableObject extends JsonObject {
	id?: string;
	domainName?: string;
	day?: string;
}

