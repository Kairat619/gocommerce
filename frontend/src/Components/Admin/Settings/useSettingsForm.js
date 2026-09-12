import { router } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * The state behind one settings section.
 *
 * Every section is a small form over a handful of fields, and every one of them
 * needs the same four things: current values, whether they differ from what is
 * saved, a way to discard, and a guard so a half-finished change is not lost by
 * a misclick. Writing that four times would guarantee four subtly different
 * unsaved-changes behaviours.
 *
 * DIRTY IS COMPARED AGAINST THE SERVER'S VALUES, NOT A FLAG.
 *
 * A flag set by onChange calls a field dirty after it is typed into and undone,
 * which then warns about changes that do not exist. Comparing the form to the
 * values the server sent means "unsaved changes" is true exactly when something
 * would actually be written.
 *
 * @param {Object} initial the saved values, from page props
 * @param {string} action  where to POST
 */
export function useSettingsForm(initial, action) {
  // The server's values are the baseline. They are re-read when the page props
  // change — which is what a successful save looks like, since the redirect
  // brings the stored values back — so saving clears the dirty state without
  // any explicit reset.
  const baseline = useMemo(() => ({ ...initial }), [initial]);

  const [values, setValues] = useState(baseline);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setValues({ ...baseline });
  }, [baseline]);

  const dirtyFields = useMemo(
    () =>
      Object.keys(baseline).filter(
        (key) => String(values[key] ?? "") !== String(baseline[key] ?? "")
      ),
    [values, baseline]
  );
  const isDirty = dirtyFields.length > 0;

  const set = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues({ ...baseline });
  }, [baseline]);

  const submit = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (!isDirty) return;

      setProcessing(true);
      router.post(action, values, {
        preserveScroll: true,
        onFinish: () => setProcessing(false),
      });
    },
    [action, values, isDirty]
  );

  useUnsavedChangesGuard(isDirty);

  return { values, set, reset, submit, isDirty, dirtyFields, processing };
}

/**
 * Warn before unsaved settings are abandoned.
 *
 * Two exits have to be covered and they are not the same mechanism:
 *
 *   - leaving the tab (reload, close, external link) — the browser's own
 *     beforeunload prompt, which is the only thing a browser will show here;
 *     its wording is not ours to choose.
 *   - an Inertia visit (the sidebar, the breadcrumb, any <Link>) — cancellable
 *     from the `before` event, so this one gets a real question with the
 *     section's own context.
 *
 * Both are removed the moment the form is clean, so a saved page never nags.
 */
function useUnsavedChangesGuard(isDirty) {
  // Read through a ref inside the listeners so they are registered once rather
  // than re-bound on every keystroke.
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      // Required by older browsers; modern ones show their own wording.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);

    const stopInertia = router.on("before", (event) => {
      if (!dirtyRef.current) return;

      // The save itself is a visit. Blocking it would make the form
      // unsubmittable, which is a memorable way to ship a broken page.
      if (event.detail?.visit?.method !== "get") return;

      const proceed = window.confirm(
        "You have unsaved changes on this page.\n\nLeave without saving? Your changes will be lost."
      );
      if (!proceed) event.preventDefault();
    });

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      stopInertia();
    };
  }, []);
}
