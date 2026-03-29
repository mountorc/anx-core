---
name: "anx-uuid-tile"
description: "处理 uuid_tile 连接 anx core 获取 markup 并通过 anx cli 完成任务。当用户提供 uuid_tile 时，自动连接后端 API 获取 Markup 并执行相关 CLI 命令。"
---

# ANX UUID Tile Processor

## 功能

- 当用户提供 uuid_tile 时，连接后端 API 获取对应的 Markup
- 支持通过 ANX CLI 执行相关命令
- 自动处理节点数据更新和 Markup 生成

## 用法

1. **用户提供 uuid_tile**：用户输入一个有效的 uuid_tile
2. **连接后端 API**：通过 `/api/convert` 接口获取对应的 Markup
3. **执行 CLI 命令**：根据需要执行相关的 ANX CLI 命令
4. **返回结果**：将获取的 Markup 和 CLI 执行结果返回给用户

## 示例

### 示例 1：获取 uuid_tile 对应的 Markup

用户输入：
```
请获取 uuid_tile 为 8dfe2709-0a95-470d-b28c-bbfa3d1c19b9 的 Markup
```

执行步骤：
1. 调用 `/api/convert` 接口，传入 uuid_tile
2. 获取返回的 Markup
3. 展示给用户

### 示例 2：获取 Markup 并执行 CLI 命令

用户输入：
```
获取 uuid_tile 为 8dfe2709-0a95-470d-b28c-bbfa3d1c19b9 的 Markup，并执行 anx set_form 命令设置数据
```

执行步骤：
1. 调用 `/api/convert` 接口，传入 uuid_tile
2. 获取返回的 Markup
3. 调用 `/api/execute-cli` 接口，执行相关命令
4. 展示 Markup 和 CLI 执行结果给用户

## 注意事项

- 确保后端服务器运行在端口 7887
- 确保 uuid_tile 是有效的，且在 hub 中存在
- 执行 CLI 命令时，确保命令格式正确

## 错误处理

- 如果 uuid_tile 不存在，返回错误信息
- 如果后端服务器未运行，提示用户启动服务器
- 如果 CLI 命令执行失败，返回错误信息
