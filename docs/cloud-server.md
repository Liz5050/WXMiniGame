# 服务端项目说明

## 基本信息

- 服务端目录：`cloud/wxgamecloud-express`
- 运行环境：Node.js `>=12.0.0`
- Web 框架：Express
- 数据库：MySQL，使用 Sequelize ORM
- 主要部署目标：微信云托管容器服务
- 默认数据库名：`nodejs_demo`
- 容器端口：`80`

该服务端为小游戏客户端提供微信 OpenID 获取、玩家数据、排行榜、皮肤商店、分享奖励、方格玩法存档、性能监控和数据库清理能力。

## 目录结构

```text
cloud/
  wxgamecloud-express/
    index.js                 服务启动入口
    src/app.js               Express 应用、API 路由和启动初始化逻辑
    src/models/index.js      Sequelize 连接与数据表模型
    src/config/              业务配置与环境配置读取
    src/services/            性能监控、数据库清理、数据库优化服务
    scripts/                 诊断、迁移、接口测试等辅助脚本
    tests/                   单元和集成测试脚本
    docs/                    服务端已有优化、测试、配置说明
    Dockerfile               微信云托管容器构建配置
    container.config.json    微信云托管服务配置
  nodejs_demo_all.sql        数据库导出文件，包含历史数据
  nodejs_demo_user_game_data.sql
  user_game_data.csv         历史导出数据
```

`cloud/` 根目录下的 SQL 和 CSV 文件包含历史用户数据，后续整理、迁移或提交前应避免泄露真实 openid、昵称、头像等用户信息。

## 启动流程

服务启动入口为 `index.js`：

```text
index.js
  -> require("./src/app")
  -> bootstrap()
  -> app.listen(PORT)
```

`bootstrap()` 当前主要做三件事：

- 创建 `DatabaseCleaner`，启动每天凌晨 2 点的数据库清理调度。
- 注册数据库清理状态、日志和手动清理接口。
- 不立即初始化数据库表，改为首次 API 请求时通过 `ensureDbInitialized()` 懒加载初始化。

数据库懒加载初始化会依次同步：

```text
user_game_data
user_data
share_rewards
game_grid_save_data
```

这种设计用于减少无请求时的数据库连接持有时间，降低云托管 MySQL 算力成本。

## 本地运行

常用命令：

```bash
npm install
npm run dev
npm run dev:3000
npm start
npm run test:quick
npm run test:safe
```

`package.json` 中的 `dev` 命令会通过 `dotenv` 读取项目根目录 `.env.local`。同时 `src/config/env.config.js` 自己也会扫描配置文件，但当前扫描路径是 `src/` 目录。因此本地配置既可能来自根目录 `.env.local`，也可能来自系统环境变量；后续调整环境配置时需要确认实际加载路径。

## 环境变量

核心环境变量：

- `PORT`：服务监听端口，本地默认 `3000`，容器默认 `80`。
- `NODE_ENV`：环境名，影响 `.env.test`、`.env.production` 选择。
- `MYSQL_USERNAME`：数据库用户名。
- `MYSQL_PASSWORD`：数据库密码。
- `MYSQL_ADDRESS`：数据库地址，格式通常为 `host:port`。
- `MYSQL_DATABASE`：数据库名，默认 `nodejs_demo`。
- `ADMIN_TOKEN`：手动数据库清理接口的管理令牌。
- `TEST_BASE_URL`：集成测试请求地址。

敏感信息不要写入文档或提交到版本控制。现有历史文档中如出现真实密码或内网地址，后续清理时应替换为占位示例。

## 数据模型

### `user_game_data`

玩家玩法成绩和排行榜数据。

主要字段：

- `openid`：微信用户 OpenID。
- `game_type`：玩法类型，对应客户端 `GameType`。
- `sub_type`：玩法子类型，例如舒尔特方格尺寸。
- `score`：成绩或积分。舒尔特玩法中分数越小越好，方格玩法中分数越大越好。
- `play_time`：累计游玩时长。
- `nick_name`：排行榜昵称。
- `avatar_url`：排行榜头像。
- `record_time`：客户端提交的记录时间。

### `user_data`

玩家账号级数据。

主要字段：

- `openid`
- `nick_name`
- `avatar_url`
- `score`：商店积分/货币。
- `skin_id`：当前使用的方格皮肤。
- `skin_list`：已拥有皮肤，当前以逗号分隔字符串保存。

### `share_rewards`

分享奖励领取记录。

主要字段：

- `openid`
- `share_time`：最近领取时间，秒级时间戳。
- `share_count`：累计领取次数。

### `game_grid_save_data`

方格玩法进度存档。

主要字段：

- `openid`
- `data_str`：客户端序列化后的存档 JSON 字符串。
- `is_valid`：存档是否有效。客户端读取成功后服务端会置为 `0`，使存档失效。

## 业务配置

配置入口：

```text
src/config/game_config.js
```

当前配置表：

- `grid_skin_shop.json`：皮肤商店配置，主键 `skin_id`。
- `illegal_user.json`：违规用户配置，主键 `openid`。

`BaseConfig` 会按主键把 JSON 数组转换成字典。新增服务端业务配置时，应保持 JSON 表结构稳定，并同步更新客户端或服务端配置说明。

## 客户端接口映射

客户端接口常量位于：

```text
MiniGame/assets/script/enum/CloudDefine.ts
```

当前客户端声明的接口均由服务端提供：

- `/api/wx_openid`
- `/api/user_game_data`
- `/api/all_user_game_data`
- `/api/user_data`
- `/api/buy_skin`
- `/api/use_grid_skin`
- `/api/add_score_coin`
- `/api/share_score_reward`
- `/api/game_grid_save`
- `/api/get_rank_data`

服务端接口变更时必须同步检查客户端 `CloudDefine.ts`、相关 Cache 调用和本文档。

## API 说明

### `GET /api/wx_openid`

微信云托管环境下，从请求头 `x-wx-openid` 读取 OpenID 并返回。接口依赖 `x-wx-source` 判断是否来自微信侧调用。

### `GET /api/user_game_data/:game_type?/:sub_type?`

查询当前 OpenID 在指定玩法和子类型下的游戏记录。

规则：

- `game_type` 必填。
- `sub_type` 默认 `0`。
- `game_type == 1002` 且客户端请求 `sub_type == 100` 时，服务端会查询数据库中的 `sub_type == 0`。

### `POST /api/user_game_data`

保存玩家游戏成绩。

请求体核心字段：

```json
{
  "game_data": {
    "game_type": 1002,
    "sub_type": 0,
    "score": 100,
    "add_play_time": 30,
    "record_time": "1700000000"
  },
  "user_info": {
    "nickName": "玩家",
    "avatarUrl": ""
  }
}
```

规则：

- `game_type == 1001`：舒尔特玩法，分数更小才刷新记录。
- `game_type == 1002`：方格玩法，分数更大才刷新记录，同时会把本次 `score` 加到 `user_data.score`。
- 昵称会过滤部分 emoji 字符。
- 舒尔特玩法会检查 `illegal_user.json`，命中后拒绝保存。

### `GET /api/all_user_game_data/:game_type?/:sub_type?`

获取排行榜数据，最多返回 100 条。

排序规则：

- `game_type == 1001`：按 `score` 升序。
- 默认：按 `score` 降序。
- `game_type == 1002 && sub_type == 101`：按 `play_time` 降序。

排行榜有内存缓存：

- 缓存 key：`game_type_sub_type`
- TTL：60 秒
- 最大缓存条目：200
- 超过限制时使用最近最少访问策略清理。

### `GET /api/user_data`

查询当前 OpenID 的账号级数据，包括积分、当前皮肤和已拥有皮肤列表。

### `POST /api/add_score_coin`

给当前 OpenID 增加积分。

请求体：

```json
{
  "score": 100
}
```

### `POST /api/buy_skin`

购买方格皮肤。

请求体：

```json
{
  "skin_id": 1
}
```

规则：

- 皮肤价格来自 `grid_skin_shop.json`。
- 积分足够时扣减 `user_data.score`，并把 `skin_id` 写入 `skin_list`。
- 已拥有皮肤会直接返回已拥有提示。

### `POST /api/use_grid_skin`

使用方格皮肤。

规则：

- 只有 `skin_list` 中已有的皮肤可以使用。
- 成功后更新 `user_data.skin_id`。

### `GET /api/share_score_reward`

查询当前用户当天是否已领取分享奖励。

返回：

```json
{
  "had_get": 0
}
```

`had_get == 1` 表示当天已领取。

### `POST /api/share_score_reward`

领取分享奖励。

规则：

- 每天只能领取一次。
- 奖励固定为 `100` 积分。
- 跨天判断按东八区零点计算。

### `POST /api/game_grid_save`

保存方格玩法进度。

请求体：

```json
{
  "jsonStr": "{}"
}
```

同一 OpenID 已有记录时覆盖 `data_str`，并设置 `is_valid = 1`。

### `GET /api/game_grid_save`

读取方格玩法进度。

规则：

- 有效存档读取成功后，会立即设置 `is_valid = 0`。
- 无存档或已失效时返回错误码。

### `GET /api/get_rank_data`

测试/调试接口，一次性返回部分排行榜数据。当前会读取 `1001`、`1002` 和 `1002_101`。

### 运维接口

- `GET /api/performance`：返回内存和响应时间统计。
- `POST /api/clear-cache`：清空排行榜缓存。
- `GET /api/db_cleanup_status`：查询数据库清理统计、表记录数量和服务器内存状态。
- `GET /api/db_cleanup_logs`：查询清理日志。当前清理服务主要输出控制台日志，文件日志能力已弱化。
- `POST /api/manual_cleanup`：手动触发清理，需要请求头 `x-admin-token` 等于 `ADMIN_TOKEN`。

## 性能与成本优化

当前服务端做了几项成本控制：

- 数据库表懒加载初始化，避免服务启动时立即建立数据库连接。
- Sequelize 连接池 `max = 5`、`min = 0`，空闲连接 5 秒释放。
- 排行榜缓存 TTL 为 60 秒，减少频繁查询 MySQL。
- 性能指标采集频率为 5 分钟，旧指标清理频率为 30 分钟。
- 只有内存压力超过 90% 时才紧急清理业务缓存并尝试触发 GC。
- 数据库清理任务每天凌晨 2 点运行，控制僵尸用户和 `user_game_data` 表规模。

后续优化排行榜或监控逻辑时，需避免频繁清空排行榜缓存，否则会让请求直接打到 MySQL，显著增加数据库算力成本。

## 数据清理规则

`DatabaseCleaner` 当前规则：

- 僵尸用户阈值：15 天未活跃。
- 批处理大小：100。
- `user_game_data` 最大记录数：50000。
- `user_data` 最大记录数：10000。
- `share_rewards` 最大记录数：10000。
- 自动清理时间：每天凌晨 2 点。

自动清理不会强制执行僵尸用户删除，只有表规模超过阈值时才清理。手动清理接口会使用 `force: true`。

## 构建与部署

`Dockerfile` 使用 Alpine 镜像，安装 Node.js 和 npm，执行：

```text
npm install
npm start
```

`container.config.json` 当前配置：

- `containerPort`: `80`
- `minNum`: `0`
- `maxNum`: `5`
- `cpu`: `0.5`
- `mem`: `1`
- 扩缩容策略：CPU 或内存达到 `80`
- 数据库名：`nodejs_demo`

微信云托管正式部署前，需要在云托管服务设置中补齐数据库环境变量，并确认 `MYSQL_ADDRESS` 指向正确环境。

## 测试与诊断

测试脚本：

- `npm run test:quick`：快速单元测试。
- `npm run test:safe`：安全启动集成测试。
- `npm test`：运行优化相关集成测试。
- `npm run test:monitor`：周期打印性能监控报告。

诊断脚本位于 `scripts/`，包括数据库检查、接口测试、保存错误定位和迁移脚本。运行会连接真实数据库或请求服务地址时，必须先确认环境变量指向的是目标环境，避免误操作生产数据。

## 后续开发注意事项

- 新增客户端云接口时，应同时更新 `MiniGame/assets/script/enum/CloudDefine.ts`、服务端路由和本文档。
- 新增数据库字段时，应同步更新 Sequelize 模型、历史 SQL/迁移脚本和相关接口说明。
- 涉及用户数据导出、SQL dump 或日志时，不要在文档中粘贴真实 openid、昵称、头像、密码、内网地址或管理令牌。
- 皮肤购买、积分发放、分享奖励等关键数据以后端写入结果为准，客户端不应只做本地乐观更新。
- 方格存档读取后会失效，客户端重试和异常恢复逻辑需要考虑这一点。
- 排行榜子类型存在兼容逻辑：`GameType.Grid` 的部分客户端子类型会映射到数据库 `sub_type = 0`，变更前需检查历史数据。
- 当前 `getUserRank()` 函数未被路由调用，且内部对 `raw: true` 返回值调用 `toJSON()`，后续启用前需要先修正。
