import { Link, usePage } from "@inertiajs/react";
import Container from "../../Components/UI/Container";
import Icon from "../../Components/UI/Icon";

/**
 * The closing call to action. Guests are invited to register; signed-in
 * customers get a shopping link instead of an offer they cannot use.
 *
 * The design shows a newsletter email field here, but the storefront has no
 * subscription endpoint — a form that posts nowhere would be a lie, so this
 * links to registration until one exists.
 *
 * @param {Object} props
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{label: string, href: string}} [props.guestAction]
 * @param {{label: string, href: string}} [props.memberAction]
 */
export default function SignupBanner({
  eyebrow,
  title,
  description,
  guestAction,
  memberAction,
}) {
  const { auth } = usePage().props;
  const action = auth?.user ? memberAction : guestAction;

  return (
    <Container as="section" className="pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-r from-accent to-[#3755c3] p-6 text-white shadow-sm md:p-10 lg:flex-row lg:items-center">
        <div className="flex max-w-xl flex-col items-start gap-2">
          {eyebrow && (
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent-soft">
              <Icon name="mail" className="h-5 w-5" />
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm leading-5 text-accent-soft">{description}</p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-6 py-3 text-[13px] font-bold text-accent shadow-md transition-all hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent active:scale-95 sm:w-auto"
          >
            {action.label}
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        )}
      </div>
    </Container>
  );
}
