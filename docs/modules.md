# 功能模块说明

## 主菜单模块

相关文件：

- `assets/script/Main.ts`
- `assets/script/game/MainMenu.ts`
- `assets/game/ui/main/Main.prefab`
- `assets/game/ui/main/MainMenu.prefab`

职责：

- 展示主界面和玩法入口。
- 切换商店/主页页签。
- 控制音效静音。
- 打开排行榜、世界排行榜、侧边栏奖励。
- 进入各玩法前触发资源预加载。

主菜单通过 `EventEnum.OnGameStart` 通知各玩法 Controller 启动。

## 商店模块

相关文件：

- `assets/script/game/shop/ShopController.ts`
- `assets/script/game/shop/GameShopView.ts`
- `assets/script/cache/GameShopCache.ts`
- `assets/script/config/GridSkinShopConfig.ts`
- `assets/resources/config/grid_skin_shop.json`

职责：

- 读取方格皮肤配置。
- 处理皮肤购买、使用、本地离线使用状态。
- 处理分享奖励状态。
- 通知 UI 更新玩家积分和皮肤状态。

数据来源：

- 配置表：`grid_skin_shop`
- 服务端接口：`buy_skin`、`use_grid_skin`、`share_score_reward`
- 本地存储：未登录时的皮肤使用/购买标记

## 舒尔特方格模块

相关文件：

- `assets/script/game/gameShulte/GameShulteController.ts`
- `assets/script/game/gameShulte/view/GameShulte.ts`
- `assets/script/game/gameShulte/view/GameShulteStartView.ts`
- `assets/script/game/gameShulte/view/GameShulteBeginView.ts`
- `assets/script/game/gameShulte/view/ShulteGridItem.ts`

职责：

- 启动舒尔特方格玩法。
- 管理不同尺寸子类型：3x3 到 8x8。
- 使用排行榜类型 `GameType.Shulte`。

首次进入预加载资源：

- `ShulteGridItemShow`
- `ShulteGridItem`

## 2D 方格消除模块

相关文件：

- `assets/script/game/gameGrid/GameGridController.ts`
- `assets/script/game/gameGrid/GameGridConst.ts`
- `assets/script/game/gameGrid/view/`
- `assets/script/cache/GameGridCache.ts`

职责：

- 2D 方格玩法入口：`GameType.Grid = 1002`
- 维护 2D 方格预览、道具、排行榜、皮肤和存档数据。
- 继续使用 `GameSubType.GirdScore`、`GameSubType.GamePlayTime` 等 2D 排行和统计链路。

首次进入 2D 方格预加载资源：

- `GameGridMapItem`
- `ScoreAddItem`

关键数据：

- `BannerRewardId.GameGridResetNum`
- `BannerRewardId.GameGridBoomNum`
- 方块形状数据 `_gridTypeList`
- 局内道具数量 `_propNum`

## Grid3D 独立战斗模块

相关文件：

- `assets/script/game/gameGrid3D/GameGrid3DController.ts`
- `assets/script/game/gameGrid3D/view/`
- `assets/script/game/gameGrid3D/scene/`
- `assets/script/game/gameGrid3D/event/GameGrid3DEvent.ts`
- `assets/script/cache/GameGrid3DCache.ts`

职责：

- 3D 方格玩法入口：`GameType.Grid3D = 1006`
- 维护 3D 局内回合占位、EntityVo 注册、目标查询、场景 ready 状态和方块预览占位数据。
- 使用 Entity-Component-EntityVo 模式组织作战单位：`BaseEntity` 不继承 Cocos `Node`，负责绑定 Vo、挂载组件并持有显示对象引用；`EntityVo` 派发数据事件；Component 承接能力或表现适配；`ComponentSystem` 作为唯一组件更新入口。
- 内部事件使用 `MessageCenter/GEvent` 的 `OnGameGrid3D...` 专用事件。

边界：

- 不复用 `GameGridCache` 的实体、回合、目标查询和场景 ready 职责。
- 不接入 1002 的排行榜、皮肤、存档和广告道具链路。
- 业务规则仍处于占位阶段，后续 roguelike、塔防、割草规则应在独立 3D 模块内实现。

详细说明见 `game-grid-3d.md`。

## 弹球模块

相关文件：

- `assets/script/game/gameBall/GameBallController.ts`
- `assets/script/game/gameBall/view/GameBallView.ts`
- `assets/script/game/gameBall/view/BallItem.ts`
- `assets/script/game/gameBall/view/Enemy.ts`
- `assets/script/cache/GameBallCache.ts`

职责：

- 初始化弹球玩法局内数据。
- 生成每回合敌人数据。
- 根据击杀数量增加球数量。

首次进入预加载资源：

- `BallItem`
- `Enemy`

## 命中/点击模块

相关文件：

- `assets/script/game/gameHit/GameHitController.ts`
- `assets/script/game/gameHit/view/GameHitView.ts`

职责：

- 响应 `GameType.GameHit` 启动命中类玩法。
- 当前 Controller 只负责懒创建并显示 `GameHitView`。

## 排行榜模块

相关文件：

- `assets/script/game/rank/RankController.ts`
- `assets/script/game/rank/view/GameWorldRankView.ts`
- `assets/script/game/rank/view/GameRankTypeSubItem.ts`
- `assets/script/cache/GameGridCache.ts`

职责：

- 展示世界排行榜。
- 从 `GameGridCache.ReqRankDataList()` 请求服务端排行榜数据。
- 微信开放数据域排行榜通过 `SDK.showRank(rankKey)` 触发。

排行榜相关类型：

- `GameType.Shulte`
- `GameType.Grid`
- `GameSubType.GirdScore`
- `GameSubType.GamePlayTime`

## 侧边栏奖励模块

相关文件：

- `assets/script/game/sideBarReward/SideBarRewardController.ts`
- `assets/script/game/sideBarReward/view/SideBarRewardView.ts`
- `assets/script/SDK/TTSDK.ts`
- `assets/script/cache/PlayerCache.ts`

职责：

- 字节跳动小游戏侧边栏能力适配。
- 判断是否能显示侧边栏奖励。
- 跳转侧边栏并发放奖励。

当前主菜单仅在字节平台且未领取对应皮肤时显示侧边栏入口。

## 通用 UI 模块

相关文件：

- `assets/script/common/tip/`
- `assets/script/common/loading/GameLoadingView.ts`
- `assets/script/common/alert/AlertView.ts`
- `assets/script/common/AudioPlayer.ts`
- `assets/script/common/TweenManager.ts`

职责：

- 滚动提示、弹窗、加载界面。
- 音频播放组件。
- Tween 更新管理。

`GameStart.gameUpdate()` 每帧调用 `TweenManager.Update(dt)`。
