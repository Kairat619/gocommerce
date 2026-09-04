import Button from "../../Components/UI/Button";
import Container from "../../Components/UI/Container";
import { decorativeImage } from "../../lib/image";

/**
 * A full-bleed closing statement with a single call to action.
 *
 * Takes no commerce data — this is entirely the theme's voice.
 *
 * @param {Object} props
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{label: string, href: string}} [props.action]
 * @param {string} [props.imageSeed]
 */
export default function EditorialBand({
  eyebrow,
  title,
  description,
  action,
  imageSeed = "editorial",
}) {
  return (
    <section className="relative overflow-hidden bg-ink">
      <img
        src={decorativeImage(imageSeed, 1920, 900)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <Container className="relative py-20 text-center md:py-28">
        {eyebrow && (
          <span className="mb-4 block text-label-lg font-semibold uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </span>
        )}
        <h2 className="mx-auto max-w-2xl text-display-lg text-white">{title}</h2>
        {description && (
          <p className="mx-auto mt-5 max-w-xl text-body-lg text-zinc-300">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-9 flex justify-center">
            <Button href={action.href} variant="inverse" size="lg">
              {action.label}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
