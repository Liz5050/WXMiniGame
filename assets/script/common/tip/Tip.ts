import { TipRoll } from "./TipRoll";

/**
 * Tip调用入口
 */
export class Tip {
    private static rollTip: TipRoll;

    /**
     * 滚动提示
     */
    public static showRollTip(tip: string, x: number = -1, y: number = -1, toY: number = -1): void {
        if (Tip.rollTip == null) {
            Tip.rollTip = new TipRoll();
        }
        // Tip.rollTip.addTip(tip, x, y, toY);
        Tip.rollTip.show(tip);
    }
}