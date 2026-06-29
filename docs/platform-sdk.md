# 平台 SDK 与外部能力

## SDK 入口

统一入口：

```text
assets/script/SDK/SDK.ts
```

平台实现：

- `WXSDK`：微信小游戏。
- `TTSDK`：字节跳动小游戏。
- `DefaultSDK`：编辑器或其他平台的空实现。

`SDK.Init()` 根据 `sys.platform` 选择当前平台实现，并调用 `init()` 和 `login()`。

## 平台选择逻辑

```ts
if (sys.platform == sys.Platform.WECHAT_GAME || sys.platform == sys.Platform.WECHAT_MINI_PROGRAM) {
    SDK._curSDK = new WXSDK();
} else if (sys.platform == sys.Platform.BYTEDANCE_MINI_GAME) {
    SDK._curSDK = new TTSDK();
} else {
    SDK._curSDK = new DefaultSDK();
}
```

业务层应调用 `SDK` 静态方法，不直接依赖 `wx` 或 `tt`。

## 登录与玩家数据

微信平台：

- 通过云托管接口 `CloudApi.wx_openid` 获取 openid。
- 设置 `SDK.openid` 后会触发 `CacheManager.player.sendGetPlayerInfo()`。
- 使用 `wx.getSetting()` 和 `wx.createUserInfoButton()` 获取用户信息。

默认平台和编辑器：

- `SDK.isMobile()` 在 `EDITOR_PAGE` 返回 `false`。
- 非移动平台下多数平台能力直接返回或打印日志。

## 云接口封装

统一方法：

- `SDK.CloudPOST(url, reqData, callBack)`
- `SDK.CloudGET(url, reqData, callBack)`

微信实现使用：

- `wx.cloud.callContainer`
- env：`prod-2gue9n1kd74122cb`
- service：`express-589u`

接口路径集中在：

```text
assets/script/enum/CloudDefine.ts
```

当前接口包括：

- `/api/wx_openid`
- `/api/user_data`
- `/api/user_game_data`
- `/api/all_user_game_data`
- `/api/buy_skin`
- `/api/use_grid_skin`
- `/api/add_score_coin`
- `/api/share_score_reward`
- `/api/game_grid_save`
- `/api/get_rank_data`

## 广告能力

激励视频奖励 ID：

```ts
export enum BannerRewardId {
    GameGridResetNum = 1,
    GameGridSkin = 2,
    GameGridBoomNum = 3,
}
```

业务层调用：

- `SDK.ShowRewardBanner(rewardId, data)`
- `SDK.ShowBannerAd()`
- `SDK.HideBannerAd()`

广告完成后会派发：

```ts
EventEnum.OnBannerAdComplete
```

并更新 `CacheManager.gameGrid` 中对应道具数量。

## 分享能力

业务层调用：

```ts
SDK.Share()
```

微信平台：

- 初始化时调用 `wx.showShareMenu()`。
- 注册 `wx.onShareAppMessage()`。
- 商店分享奖励通过 `GameShopCache.sendShare()` 与后端接口配合。

## 排行榜能力

开放数据域排行榜入口：

```ts
SDK.showRank(rankKey)
```

内部通过：

```ts
SDK.postMessage({
    type: "ShowRank",
    width: 1080,
    height: 1800,
    x: 540,
    y: 1080,
    rankKey
});
```

世界排行榜则通过服务端接口 `all_user_game_data` 获取。

## 字节跳动侧边栏能力

`TTSDK` 提供：

- `checkScene({ scene: "sidebar" })`
- `navigateToScene({ scene: "sidebar" })`
- `canShowSideBarReward()`

侧边栏跳转成功后会写入：

```text
Storage key: SideBarReward
```

玩家领取奖励逻辑位于 `PlayerCache.getSideReward()`。

## 平台开发注意事项

- 新增平台 API 前先在对应 d.ts 中补充声明，避免 TypeScript 报错。
- 不要在 View 中直接调用 `wx` 或 `tt`，应在 `SDK` 层增加抽象方法。
- 广告、分享、登录均为异步流程，业务层应通过事件或回调刷新 UI。
- 编辑器环境下应保证平台能力为空实现可运行，方便本地调试。
