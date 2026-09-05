"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

export type FAQItem = {
  question: string;
  answer: string;
};

export type FAQSectionWebsiteProps = {
  title?: string;
  subtitle?: string;
  faqs?: FAQItem[];
};

export function FAQSectionWebsite({
  title = "FAQ",
  subtitle = "Frequently asked questions",
  faqs = [],
}: FAQSectionWebsiteProps) {
  return (
    <section className="w-full py-12 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>

        {}
        {faqs.length > 0 && (
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="group bg-card border border-border rounded-xl overflow-hidden
                  hover:border-primary/40 hover:bg-muted/10 transition-all duration-200"
              >
                <AccordionTrigger
                  className="flex items-center gap-4 px-6 py-4 hover:no-underline
                    hover:bg-muted/30 transition-colors
                    [&>svg]:shrink-0 [&>svg]:text-muted-foreground/50
                    group-data-[state=open]:[&>svg]:text-primary dark:group-data-[state=open]:[&>svg]:text-secondary-foreground"
                >
                  {}
                  <span
                    className="flex-1 text-left text-sm font-semibold text-foreground leading-snug
                    group-hover:text-primary dark:group-hover:text-secondary-foreground transition-colors"
                  >
                    {faq.question}
                  </span>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
}
