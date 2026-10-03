import Icon from "../UI/Icon";
import cn from "../../lib/cn";

/**
 * Checkout progress. The steps are sections of one page rather than separate
 * screens, so each step's state is worked out from what the shopper has
 * filled in — this only draws it.
 *
 * @param {Object} props
 * @param {{label: string, state: "done"|"current"|"upcoming"}[]} props.steps
 */
const tones = {
  done: { dot: "bg-accent text-white", label: "text-ink", step: "text-accent" },
  current: { dot: "bg-accent text-white ring-4 ring-accent-soft", label: "text-ink", step: "text-accent" },
  upcoming: { dot: "bg-muted text-outline", label: "text-muted-foreground", step: "text-outline" },
};

export default function CheckoutSteps({ steps }) {
  return (
    <ol className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3 md:px-6">
      {steps.map((step, index) => {
        const tone = tones[step.state] || tones.upcoming;
        return (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex items-center gap-3"
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                tone.dot
              )}
            >
              {step.state === "done" ? (
                <Icon name="check" className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </span>
            <span className="leading-tight">
              <span className={cn("block text-[11px] font-bold uppercase tracking-wider", tone.step)}>
                Step {index + 1}
                <span className="sr-only">
                  {step.state === "done" ? " (complete)" : step.state === "current" ? " (current)" : ""}
                </span>
              </span>
              <span className={cn("block text-sm font-semibold", tone.label)}>{step.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
