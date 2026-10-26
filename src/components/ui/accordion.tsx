import { useState } from "react";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode | ((state: { open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode);
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionHeaderProps {
  children: React.ReactNode;
}

const ChevronDown = () => (
  <svg className="h-4 w-4 text-[var(--cor-texto-suave)] transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export function Accordion({ children, className = "" }: AccordionProps) {
  return <div className={className}>{children}</div>;
}

export function AccordionItem({ value, children }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  const renderChildren = typeof children === "function" ? children({ open, onOpenChange: setOpen }) : children;
  return <div data-value={value}>{renderChildren}</div>;
}

export function AccordionHeader({ children }: AccordionHeaderProps) {
  return <div>{children}</div>;
}

export function AccordionTrigger({ children, className = "" }: AccordionTriggerProps) {
  return (
    <button
      type="button"
      className={`flex items-center justify-between w-full px-4 py-3 text-left font-medium transition-colors hover:text-[var(--cor-destaque)] ${className}`}
    >
      {children}
      <ChevronDown />
    </button>
  );
}

export function AccordionContent({ children, className = "" }: AccordionContentProps) {
  return <div className={`overflow-hidden transition-all duration-200 ${className}`}>{children}</div>;
}