export enum GameType {
	Shulte = 1001,
	Grid = 1002,
	Memory = 1003,
	Nullify = 1004,
}

export enum GameSubType {
	Shulte3X3 = 3,
	Shulte4X4 = 4,
	Shulte5X5 = 5,
	Shulte6X6 = 6,
	Shulte7X7 = 7,
	Shulte8X8 = 8,
}

export class GameDefine {
	public static ShulteSubTypes = [GameSubType.Shulte3X3,GameSubType.Shulte4X4,GameSubType.Shulte5X5,GameSubType.Shulte6X6,GameSubType.Shulte7X7,GameSubType.Shulte8X8];
}