import { GameGridEvent, GameGridEventData } from "../game/gameGrid/event/GameGridEvent";
import { GameGrid3DEvent, GameGrid3DEventData } from "../game/gameGrid3D/event/GameGrid3DEvent";
import { GlobalEvent, GlobalEventData } from "./GlobalEvent";
import { LoginEvent, LoginEventData } from "./LoginEvent";
export const GEvent = <const>{
    ...LoginEvent,
    ...GameGridEvent,
    ...GameGrid3DEvent,
    ...GlobalEvent,
};

/** global消息ID（汇总） */
export type GEventType = typeof GEvent;

/**
 * global消息用户数据类型（汇总）
 */
export type GEventData = Prettify<
    LoginEventData
    & GameGridEventData
    & GameGrid3DEventData
    & GlobalEventData
>;
