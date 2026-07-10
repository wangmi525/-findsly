## 商业化方案

### 定价
| 套餐 | 月费 | 年费 | 用户数 | 月搜索 |
|------|------|------|--------|--------|
| Starter |  |  | 1 | 600 |
| Pro |  |  | 1 | 2,000 |
| Growth |  |  | 5 | 5,000 |
| Scale |  |  | 15 | 15,000 |

### 竞品对比
| 竞品 | 价格 | 我们的优势 |
|------|------|-----------|
| Apollo.io |  | 多渠道 + AI + 便宜50% |
| Pipedrive |  | 含找客户 + 10渠道 |
| Hunter.io |  | AI + CRM + 管道 |

### 收入预测
保守: M1  → M12  MRR
中性: M1  → M12  MRR
乐观: M1  → M12  MRR

### LTV/CAC
LTV:  =  (Starter)
CAC:  (开源 + 社区)
LTV/CAC: ∞

## 运营就绪 Check List

| 项目 | 状态 |
|------|------|
| Vercel 部署 | ? findsly.vercel.app |
| Supabase 数据库 | ? 10表+RLS |
| Stripe 支付 | ? 4产品+Webhook |
| Google OAuth | ?? 待配 Supabase |
| Groq AI | ? |
| Resend 邮件 | ? |
| GitHub 开源 | ? github.com/wangmi525/-findsly |
| 备份策略 | ? Supabase 自动备份 |
| 监控 | ? Vercel Analytics |
| 客服 | ?? 待设邮箱 |
| 隐私条款 | ?? 待添加 |
| Cookie 同意 | ?? 待添加 |

## 迭代规划 V2
### V2 目标
- Google OAuth 完整接入
- 搜索结果实际爬取（非 mock）
- 邮件追踪像素
- 客服系统

### 砍掉 V1 功能
- 预设模板（使用率 < 5%）
- Instagram 预填链接（使用率低）
