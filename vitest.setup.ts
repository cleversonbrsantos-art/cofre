import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// jsdom não implementa ResizeObserver (usado pelo ResponsiveContainer do Recharts).
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;
