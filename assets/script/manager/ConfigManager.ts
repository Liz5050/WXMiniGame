import { GridSkinShopConfig } from "../config/GridSkinShopConfig"

/**配置管理 */
export class ConfigManager {
    public static Data:any = {};
    public static gridShop:GridSkinShopConfig;
    public static init(){
        ConfigManager.gridShop = new GridSkinShopConfig();
    }
}