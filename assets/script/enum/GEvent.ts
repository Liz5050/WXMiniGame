import { GameGridEvent, GameGridEventData } from "../game/gameGrid/event/GameGridEvent";
import { LoginEvent, LoginEventData } from "./LoginEvent";
export const GEvent = <const>{
    ...LoginEvent,
    ...GameGridEvent,
};

/** global消息ID（汇总） */
export type GEventType = typeof GEvent;

/**
 * global消息用户数据类型（汇总）
 */
export type GEventData = Prettify<
    LoginEventData
    & GameGridEventData
>;