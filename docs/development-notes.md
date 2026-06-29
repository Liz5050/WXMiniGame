# 后续迭代注意事项

## 当前已知现状

本项目正在重构中，当前源码存在以下现象：

- 部分文件存在未完成实现或占位实现。
- 部分 Controller、Manager、UI 管理代码仍较薄，例如 `UIMgr` 尚未完整实现。
- 事件系统存在新旧并存迹象。
- 3D 方格战斗模块已引入 Entity、Vo、Component、`ComponentSystem` 和状态机，但部分流程仍处于迁移期。

## 推荐重构顺序

1. 建立可运行基线：确认 Cocos Creator 3.7.4 打开、预览、微信构建是否能稳定运行。
2. 梳理事件系统：决定继续使用 `EventManager/EventEnum`，还是逐步迁移到 `MessageCenter/GEvent`。
3. 稳定资源加载：明确 Bundle 名称、Prefab 路径、配置表加载入口。
4. 分模块整理玩法：先处理主菜单、商店、排行榜，再处理各玩法内部逻辑。
5. 单独整理 3D 战斗运行时：Entity、Vo、Component、`ComponentSystem`、状态机应作为独立子系统维护，核心战斗规则优先通过组件组合表达。

## 新增功能接入清单

新增一个玩法时，至少检查：

- `GameType` 是否新增类型。
- `UIModuleEnum` 是否新增 UI 模块。
- `ControllerManager` 是否创建 Controller。
- `GameDefine.getGameRes()` 是否配置预加载资源。
- `assets/game/ui/{module}` 是否有对应 Prefab。
- View 是否继承合适的基类。
- 是否需要 Cache 保存局内数据。
- 是否需要服务端接口或本地存储。
- 是否需要排行榜、广告、分享、音效接入。

## 新增 UI 检查清单

- Prefab 路径符合 `assets/game/ui/{module}/{ViewName}.prefab`。
- View 构造函数中的 `moduleId` 和 `viewName` 与资源路径一致。
- 节点名称与代码中的 `getChildByName/getChildByPath` 一致。
- 点击事件只绑定一次。
- 隐藏或销毁时清理定时器和长期事件监听。
- 需要复用的特效、音效、图集通过 `Mgr.loader` 或 `Mgr.soundMgr` 访问。

## 数据与存档注意事项

- 玩家积分、皮肤购买等关键数据应以后端返回为准。
- 未登录状态下可用 `StorageCache` 保存临时本地数据，但登录后需要明确合并策略。
- `GameGridCache.sendSaveGame()` 会把局内道具和广告奖励状态一起写入存档。
- `GameCache` 会改写 `director.tick` 来实现速度缩放，涉及全局时间时需谨慎。

## 资源提交注意事项

- Cocos 资源和 `.meta` 文件应一起提交。
- 使用 Cocos Creator 3.7.4 编辑资源，避免版本差异导致 `.meta` 大面积变化。
- 新增 Bundle 资源后确认构建平台配置是否正确。
- 微信和字节模板中的平台配置不要混用。

## 测试建议

当前项目未看到自动化测试配置，建议以后续手动冒烟测试为主：

- 编辑器预览能进入主界面。
- 主菜单按钮能打开各玩法入口。
- UI 加载时 Loading 能正常显示和关闭。
- 音效开关不报错。
- 未登录环境下商店和本地皮肤状态不报错。
- 微信小游戏真机或开发者工具中登录、分享、广告、排行榜链路可用。
- 字节平台侧边栏逻辑在对应平台单独验证。

## 不建议混入同一提交的事项

- 资源 `.meta` 大面积变化与脚本重构。
- 事件系统迁移与玩法逻辑修复。
- 平台 SDK 改动与 UI 视觉调整。
- 3D 战斗系统重构与普通 2D UI 调整。
