"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { ShoppingBag, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import styles from "./service-network.module.css";

interface NetworkCategory { id: string; title: string; icon: LucideIcon }
interface ServiceNetworkProps {
  categories: NetworkCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
}
const nodes = [[50, 13], [22, 35], [78, 35], [22, 81], [78, 81]] as const;
const connections = nodes.map(([x, y]) => `M 50 50 Q 50 ${(50 + y) / 2} ${x} ${y}`);

export default function ServiceNetwork({ categories, selectedId, onSelect, label }: ServiceNetworkProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(0);
  const hub = useRef<HTMLButtonElement>(null);
  const branchesId = useId();
  const FeaturedIcon = categories.find(category => category.id === selectedId)?.icon ?? ShoppingBag;
  const primary = categories.slice(0, nodes.length);
  const custom = categories.slice(nodes.length);
  const hint = expanded ? (ar ? "إخفاء الخدمات" : "Hide services") : (ar ? "اكتشف الخدمات" : "Explore services");

  const renderNode = (category: NetworkCategory, style?: CSSProperties) => (
    <Button key={category.id} type="button" variant="outline" className={styles.node} style={style}
      aria-pressed={category.id === selectedId} aria-controls="selected-service"
      onClick={() => { onSelect(category.id); setPulse(value => value + 1); }}>
      <category.icon aria-hidden="true" className="size-4" />
      <span>{category.title}</span>
    </Button>
  );

  return (
    <div className={styles.network} role="group" aria-label={label} data-expanded={expanded}
      onKeyDown={event => {
        if (event.key === "Escape" && expanded) {
          setExpanded(false);
          hub.current?.focus();
        }
      }}>
      {pulse > 0 && <span key={pulse} className={styles.ripple} aria-hidden="true" />}
      <div key={selectedId} className={styles.backdropIcon} aria-hidden="true">
        <FeaturedIcon strokeWidth={1.1} />
      </div>
      <div className={styles.graph}>
        <button ref={hub} type="button" className={styles.center} aria-expanded={expanded}
          aria-controls={custom.length ? `${branchesId} ${branchesId}-custom` : branchesId} onClick={() => { setExpanded(value => !value); setPulse(value => value + 1); }}>
          <FeaturedIcon key={selectedId} strokeWidth={1.5} aria-hidden="true" />
          <span>{hint}</span>
        </button>
        <div id={branchesId} className={styles.branches} inert={!expanded} aria-hidden={!expanded}>
          <svg className={styles.connections} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {primary.map((category, index) => (
              <path key={category.id} d={connections[index]} fill="none" pathLength="1" vectorEffect="non-scaling-stroke"
                data-selected={category.id === selectedId} style={{ "--index": index } as CSSProperties} />
            ))}
          </svg>
          {primary.map((category, index) => renderNode(category, {
            "--node-x": `${nodes[index][0]}%`, "--node-y": `${nodes[index][1]}%`, "--index": index,
            "--from-x": `${(50 - nodes[index][0]) * (ar ? -1 : 1)}cqw`, "--from-y": `${50 - nodes[index][1]}cqh`,
          } as CSSProperties))}
        </div>
      </div>
      {custom.length > 0 && <div id={`${branchesId}-custom`} className={styles.custom} hidden={!expanded}
        inert={!expanded}>{custom.map(category => renderNode(category))}</div>}
    </div>
  );
}
