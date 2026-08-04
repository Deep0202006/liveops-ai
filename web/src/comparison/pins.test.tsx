import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinsProvider, usePins } from "./pins";

describe("pinned asset state",()=>{
  it("enforces the three-asset limit with an explicit reason",()=>{
    const {result}=renderHook(()=>usePins(),{wrapper:PinsProvider});
    act(()=>{result.current.pin("A");result.current.pin("B");result.current.pin("C")});
    let fourth:ReturnType<typeof result.current.pin>|undefined;
    act(()=>{fourth=result.current.pin("D")});
    expect(result.current.pins).toEqual(["A","B","C"]);
    expect(fourth).toEqual({ok:false,reason:expect.stringContaining("Remove or replace")});
  });

  it("supports unpin, replace, clear, and scenario validity cleanup",()=>{
    const {result}=renderHook(()=>usePins(),{wrapper:PinsProvider});
    act(()=>{result.current.pin("A");result.current.pin("B")});
    act(()=>result.current.replace("A","C"));
    expect(result.current.pins).toEqual(["C","B"]);
    act(()=>result.current.unpin("B"));
    expect(result.current.pins).toEqual(["C"]);
    act(()=>{result.current.pin("D");result.current.retainValid(["D"])});
    expect(result.current.pins).toEqual(["D"]);
    act(()=>result.current.clear());
    expect(result.current.pins).toEqual([]);
  });
});
