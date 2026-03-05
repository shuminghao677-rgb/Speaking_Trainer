import { useEffect, useState } from 'react';

/**
 * useLocalStorage - 兼容的 localStorage 钩子
 * - 读取时：尝试 JSON.parse；若解析失败则返回原始字符串；若没有值则返回 initialValue。
 * - 写入时：如果值为 string，则直接写入原始字符串（保留兼容）；否则写入 JSON.stringify(value)。
 *
 * 用法：const [value, setValue] = useLocalStorage('key', defaultValue);
 */
export function useLocalStorage(key, initialValue) {
  const readValue = () => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      try {
        // 尝试解析 JSON（适用于数组/对象/被 stringify 的值）
        return JSON.parse(item);
      } catch (e) {
        // 解析失败：说明存的是原始字符串（例如 API key），返回原始字符串
        return item;
      }
    } catch (e) {
      // 发生异常（例如权限问题），回退到默认值
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  };

  const [state, setState] = useState(readValue);

  useEffect(() => {
    try {
      if (typeof state === 'string') {
        // 字符串直接写入，保持兼容现有逻辑（避免双重引号问题）
        localStorage.setItem(key, state);
      } else {
        // 对象/数组等使用 JSON 保存
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (e) {
      // 忽略写入错误（例如私有模式或存储配额），避免抛出到 UI
      // 可在此处增加 console.warn(e) 便于调试
      // console.warn('[useLocalStorage] write failed', e);
    }
  }, [key, state]);

  return [state, setState];
}