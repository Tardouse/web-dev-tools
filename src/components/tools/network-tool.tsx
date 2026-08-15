"use client";

import { CircleAlert, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeNetworkValue } from "@/lib/tools/developer-tools";
import type { ToolComponentProps } from "@/lib/types";

export function NetworkCalculatorTool({ locale }: ToolComponentProps) {
  const zh = locale === "zh";
  const [input, setInput] = useState("192.168.10.42/24");
  const result = useMemo(() => {
    try {
      return { value: analyzeNetworkValue(input), error: "" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Analysis failed." };
    }
  }, [input]);
  return (
    <section className="tool-workspace card reference-tool network-workbench">
      <div className="workspace-header"><h2>{zh ? "网络地址分析" : "Network address analysis"}</h2>{result.value && <span className="badge">{result.value.type}</span>}</div>
      <div className="reference-search"><Search size={18} /><input aria-label={zh ? "网络值" : "Network value"} value={input} onChange={(event) => setInput(event.target.value)} placeholder={zh ? "IPv4、IPv6、CIDR、MAC 或 URL" : "IPv4, IPv6, CIDR, MAC, or URL"} /></div>
      {result.error && <div className="error-banner" role="alert"><CircleAlert size={17} />{result.error}</div>}
      {result.value && <dl className="network-result-grid">{Object.entries(result.value).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
    </section>
  );
}
