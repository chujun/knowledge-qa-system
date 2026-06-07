# 个人知识问答系统安全设计

日期：2026-06-07

关联文档：

```text
docs/knowledge-qa-architecture.md
docs/knowledge-qa-api-draft.md
docs/knowledge-qa-mcp-tools.md
docs/TODO.md
```

## 阶段：安全设计

阶段结论：

```text
MVP 采用本地单用户 Web 模式，API/Agent 调用使用 API Key。
安全重点是保护外部会话原文、用户答案、模型 API Key、提示词、模型响应和审计日志。
第一版不做复杂多用户权限，但必须为后续多用户扩展保留 user_id 和认证边界。
```

已确认事项：

```text
Web 页面采用本地单用户模式。
API/Agent 调用使用 API Key。
MCP Tool 通过环境变量读取 API Key 调用后端。
MVP 本地服务部署，不使用 Docker。
默认大模型为 chatgpt-5.5，默认 AI Agent 为 Codex。
```

待确认事项：

```text
API Key 是否由系统首次启动自动生成。
会话原文是否默认完整保存，还是默认保存摘要并允许用户选择保存原文。
模型 prompt 和 response 是否完整入库。
```

风险点：

```text
外部会话可能包含密钥、token、项目敏感信息或隐私内容。
模型调用日志和审计日志如果保存完整原文，可能造成敏感信息扩散。
本地服务如果监听非本机地址，API Key 必须强制启用。
```

下一步动作：

```text
进入可观测性设计，生成 docs/knowledge-qa-observability.md。
```

## 1. 身份识别和认证

MVP 认证策略：

```text
Web 页面：本地单用户模式。
API 调用：API Key。
MCP/Agent 调用：API Key。
后续多用户：扩展 Bearer Token 或登录态。
```

API Key 规则：

```text
API Key 不写入代码仓库。
API Key 通过环境变量或本地配置文件加载。
API Key 不出现在日志、审计事件、MCP Tool 输出中。
API Key 泄露后需要支持重新生成。
```

建议请求头：

```text
X-API-Key: <api_key>
```

或：

```text
Authorization: Bearer <token>
```

## 2. 授权控制

MVP 单用户下，授权边界仍然保留：

```text
所有核心对象都有 user_id。
API 查询时必须按 user_id 过滤。
Agent/API 调用解析出的 user_id 只能访问自己的数据。
审计日志记录 actor_type 和 actor_id。
```

后续多用户扩展：

```text
用户登录
个人知识库隔离
API Token 绑定用户
管理员审计权限
共享知识库权限
```

## 3. MCP Tool 调用认证

MCP Server 调用后端 API 时：

```text
从 KNOWLEDGE_QA_API_KEY 读取 API Key。
从 KNOWLEDGE_QA_API_BASE_URL 读取 API 地址。
不在 Tool 输出中显示 API Key。
不在错误消息中回显 API Key。
```

MCP Tool 输入校验：

```text
source_system 必须在允许列表或被标记为 custom。
conversation_content 和 conversation_summary 至少有一个。
direct_confirm=true 时必须确认用户明确授权。
idempotency_key 长度和字符范围需要校验。
```

## 4. 外部输入校验

需要校验的输入：

```text
Web 表单输入
HTTP API 请求体
MCP Tool 参数
外部会话内容
模型返回内容
用户答案
文档导入内容
```

校验规则：

```text
必填字段非空。
字符串长度限制。
枚举字段必须在允许范围内。
UUID 格式校验。
JSON schema 校验。
HTML/Markdown 内容转义或安全渲染。
文件路径不得由用户任意指定。
```

## 5. 会话原文敏感信息处理

外部会话可能包含：

```text
API Key
访问 token
密码
服务器地址
项目路径
客户信息
个人隐私
业务敏感内容
```

MVP 处理策略：

```text
保存 SourceReference 前执行敏感信息检测。
检测到疑似密钥或 token 时，提示用户确认。
支持保存摘要而不是完整原文。
日志中不记录完整 conversation_content。
MCP Server 只记录内容长度、hash、source_system、conversation_id。
```

脱敏示例：

```text
sk-abcdef123456 -> sk-***REDACTED***
Bearer eyJ... -> Bearer ***REDACTED***
password=xxx -> password=***REDACTED***
```

## 6. 用户答案敏感信息处理

用户答案可能包含：

```text
真实项目配置
命令输出
错误日志
路径
密钥片段
内部系统信息
```

规则：

```text
AnswerAttempt 保存前可进行敏感模式检测。
日志中不直接输出 user_answer。
审计事件中只保存摘要或 hash，除非业务确实需要完整快照。
用户可选择删除或脱敏某条来源内容。
```

## 7. 日志脱敏规则

应用日志不得记录：

```text
API Key
模型 API Key
完整外部会话原文
完整用户答案
完整 prompt
完整模型响应
```

允许记录：

```text
request_id
user_id
target_type
target_id
event_type
status
耗时
token 数
成本
错误码
脱敏摘要
内容 hash
```

## 8. 模型 API Key 存储

模型密钥来源：

```text
环境变量
本地未提交配置文件
后续可扩展为密钥管理服务
```

规则：

```text
不得提交到 Git。
不得写入日志。
不得写入审计事件。
不得返回给 Web 或 MCP Tool。
配置模板只能写变量名，不写真实值。
```

建议环境变量：

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
MINIMAX_API_KEY
KNOWLEDGE_QA_API_KEY
```

## 9. Prompt 和模型响应保存策略

MVP 推荐：

```text
ModelCallRecord 保存 request_summary 和 response_summary。
默认不保存完整 prompt 和完整 response。
如后续需要完整保存，必须支持脱敏和用户开关。
```

原因：

```text
完整 prompt 可能包含会话原文、用户答案、系统指令和敏感上下文。
完整 response 可能重复敏感内容。
```

## 10. 来源内容访问权限

规则：

```text
SourceReference 只允许所属 user_id 访问。
外部 Agent 只能通过 API Key 访问当前用户数据。
review_url 不应绕过认证。
确认链接如果包含 token，token 必须短期有效。
```

MVP 本地服务：

```text
如果只监听 127.0.0.1，风险较低。
如果监听 0.0.0.0，必须强制 API Key。
```

## 11. 审计日志访问权限

审计日志包含敏感业务行为。

规则：

```text
只允许本地用户或认证 API 查询。
审计日志不得被普通业务删除。
审计日志查询需要分页。
审计日志中的 before_snapshot / after_snapshot 应尽量脱敏。
```

## 12. 常见安全风险防护

### 12.1 注入风险

防护：

```text
数据库访问使用参数化查询或 ORM。
禁止拼接 SQL。
对模型返回的结构化 JSON 进行 schema 校验。
```

### 12.2 XSS

防护：

```text
Web 渲染用户输入、模型输出、会话内容时进行 HTML 转义。
Markdown 渲染使用安全模式。
禁止直接注入未清洗 HTML。
```

### 12.3 CSRF

MVP 本地单用户下风险较低，但如果使用 Cookie 登录态，需要：

```text
CSRF Token
SameSite Cookie
敏感操作使用 POST + 认证
```

API Key 调用优先走请求头，不使用 Cookie。

### 12.4 SSRF

未来文档/网页导入时需要防护：

```text
限制 URL scheme 为 http/https。
禁止访问 localhost、内网 IP、metadata 地址。
设置请求超时和大小限制。
```

MVP 暂不实现自动网页抓取。

### 12.5 路径穿越

未来文件导入时需要：

```text
禁止用户控制任意本地路径。
限制上传目录。
规范化路径并检查目录边界。
```

### 12.6 文件上传

MVP 暂不实现自动文档导入。

后续需要：

```text
文件大小限制
文件类型白名单
恶意内容扫描
上传目录隔离
```

### 12.7 不安全反序列化

规则：

```text
不要反序列化不可信对象。
只解析 JSON。
对 JSON 进行 schema 校验。
```

## 13. 敏感操作审计

必须审计：

```text
外部 Agent 提交沉淀任务
用户确认正式入库
用户直接入库
用户编辑题目/答案/评分规则
用户修正 AI 评分
来源冲突处理
API Key 生成或轮换
质量校验人工放行
删除或脱敏来源内容
```

## 14. 安全验收点

```text
API/Agent 调用必须校验 API Key。
API Key 不出现在日志、审计事件和 Tool 输出中。
外部会话原文进入系统前有敏感信息检测或脱敏策略。
日志不记录完整会话原文和完整用户答案。
模型 API Key 只从环境变量或未提交配置读取。
review_url 不能绕过认证。
模型输出进入系统前经过 schema 校验。
Web 页面渲染用户/模型内容时防 XSS。
审计日志记录敏感操作。
```

