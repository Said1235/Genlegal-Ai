"use client";

import type { LocalUrlAnalysis, UrlVerdict } from "./contracts/urlTypes";

const KEY = "genlegal_url_analyses";
const MAX_STORED = 100;

function readList(): LocalUrlAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeList(list: LocalUrlAnalysis[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_STORED)));
}

export function storeUrlAnalysis(entry: LocalUrlAnalysis): void {
  const list = readList();
  // Replace if same URL was analyzed before, otherwise prepend
  const idx = list.findIndex((e) => e.url === entry.url);
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(entry);
  writeList(list);
}

export function getAllUrlAnalyses(): LocalUrlAnalysis[] {
  return readList();
}

export function getUrlAnalysis(url: string): LocalUrlAnalysis | null {
  return readList().find((e) => e.url === url) ?? null;
}
