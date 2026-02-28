// 基于条件的等待工具的完整实现
// 来源：Lace 测试基础设施改进（2025-10-03）
// 背景：通过替换任意超时修复了15个不稳定测试

import type { ThreadManager } from '~/threads/thread-manager';
import type { LaceEvent, LaceEventType } from '~/threads/types';

/**
 * 等待线程中出现特定类型的事件
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param eventType - 要等待的事件类型
 * @param timeoutMs - 最大等待时间（默认5000毫秒）
 * @returns 解析为第一个匹配事件的 Promise
 *
 * 示例：
 *   await waitForEvent(threadManager, agentThreadId, 'TOOL_RESULT');
 */
export function waitForEvent(
  threadManager: ThreadManager,
  threadId: string,
  eventType: LaceEventType,
  timeoutMs = 5000
): Promise<LaceEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const event = events.find((e) => e.type === eventType);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`等待 ${eventType} 事件超时，已超过 ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10); // 每10毫秒轮询一次以提高效率
      }
    };

    check();
  });
}

/**
 * 等待给定类型的事件达到指定数量
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param eventType - 要等待的事件类型
 * @param count - 要等待的事件数量
 * @param timeoutMs - 最大等待时间（默认5000毫秒）
 * @returns 当数量达到时解析为所有匹配事件的 Promise
 *
 * 示例：
 *   // 等待2个 AGENT_MESSAGE 事件（初始响应 + 续写）
 *   await waitForEventCount(threadManager, agentThreadId, 'AGENT_MESSAGE', 2);
 */
export function waitForEventCount(
  threadManager: ThreadManager,
  threadId: string,
  eventType: LaceEventType,
  count: number,
  timeoutMs = 5000
): Promise<LaceEvent[]> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const matchingEvents = events.filter((e) => e.type === eventType);

      if (matchingEvents.length >= count) {
        resolve(matchingEvents);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(
          new Error(
            `等待 ${count} 个 ${eventType} 事件超时，已超过 ${timeoutMs}ms（已获得 ${matchingEvents.length} 个）`
          )
        );
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

/**
 * 等待匹配自定义谓词的事件
 * 当你需要检查事件数据而不仅仅是类型时很有用
 *
 * @param threadManager - 要查询的线程管理器
 * @param threadId - 要检查事件的线程
 * @param predicate - 当事件匹配时返回 true 的函数
 * @param description - 用于错误消息的人类可读描述
 * @param timeoutMs - 最大等待时间（默认5000毫秒）
 * @returns 解析为第一个匹配事件的 Promise
 *
 * 示例：
 *   // 等待具有特定 ID 的 TOOL_RESULT
 *   await waitForEventMatch(
 *     threadManager,
 *     agentThreadId,
 *     (e) => e.type === 'TOOL_RESULT' && e.data.id === 'call_123',
 *     'id=call_123 的 TOOL_RESULT'
 *   );
 */
export function waitForEventMatch(
  threadManager: ThreadManager,
  threadId: string,
  predicate: (event: LaceEvent) => boolean,
  description: string,
  timeoutMs = 5000
): Promise<LaceEvent> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const events = threadManager.getEvents(threadId);
      const event = events.find(predicate);

      if (event) {
        resolve(event);
      } else if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`等待 ${description} 超时，已超过 ${timeoutMs}ms`));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
}

// 实际调试会话中的使用示例：
//
// 之前（不稳定）：
// ---------------
// const messagePromise = agent.sendMessage('Execute tools');
// await new Promise(r => setTimeout(r, 300)); // 希望工具在300毫秒内启动
// agent.abort();
// await messagePromise;
// await new Promise(r => setTimeout(r, 50));  // 希望结果在50毫秒内到达
// expect(toolResults.length).toBe(2);         // 随机失败
//
// 之后（可靠）：
// ----------------
// const messagePromise = agent.sendMessage('Execute tools');
// await waitForEventCount(threadManager, threadId, 'TOOL_CALL', 2); // 等待工具启动
// agent.abort();
// await messagePromise;
// await waitForEventCount(threadManager, threadId, 'TOOL_RESULT', 2); // 等待结果
// expect(toolResults.length).toBe(2); // 始终成功
//
// 结果：通过率 60% → 100%，执行速度快40%
