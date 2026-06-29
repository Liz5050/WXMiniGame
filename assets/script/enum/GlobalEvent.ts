import { GameType } from "./GameType";

export const GlobalEvent = <const> {
    OnGameStart : "OnGameStart",
    OnGameExit : "OnGameExit",
    OnGameResAllReady : "OnGameResAllReady",
}
export type GlobalEventData = UnionRecords<
    [
        Record<typeof GlobalEvent.OnGameResAllReady,GameType>,
        Record<typeof GlobalEvent.OnGameStart,GameType>,
        Record<typeof GlobalEvent.OnGameExit,GameType>,
    ]
>;